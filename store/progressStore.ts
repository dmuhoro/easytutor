import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { logEvent, logError } from '../lib/logEvent';
import { assertRequiredWriteFields, getAuthenticatedUser, getSupabaseClient, logSupabaseError } from '../lib/supabaseOps';
import { resolveTopicIdOrThrow } from '../lib/resolveTopicId';


export interface QuizScore {
  date: string;
  score: number;
  total: number;
  topic: string;
}

export interface XPEvent {
  value: number;
  timestamp: string;
  source: 'quiz' | 'task' | 'streak';
}

export const getLevel = (xp: number): string => {
  if (xp >= 1000) return 'Expert';
  if (xp >= 600) return 'Advanced';
  if (xp >= 300) return 'Scholar';
  if (xp >= 100) return 'Explorer';
  return 'Beginner';
};

interface ProgressState {
  userId: string | null;
  topicsStudied: Record<string, string[]>;
  quizScores: QuizScore[];
  studyStreak: number;
  xpTotal: number;
  cloudXPEnabled: boolean;
  streakFreezes: number;
  lastOpenedDate: string;
  xpEvents: XPEvent[];
  
  setUserId: (id: string | null) => void;
  syncFromCloud: () => Promise<void>;
  awardXP: (amount: number, source?: XPEvent['source']) => Promise<void>;
  markTopicDone: (subjectId: string, topicId: string, topicName: string) => Promise<void>;
  addQuizScore: (score: number, total: number, topic: string, subjectId: string, topicId?: string) => Promise<void>;
  updateStreak: () => Promise<void>;
  syncPendingProgress: () => Promise<void>;
  clearProgress: () => void;
  pendingProgressSync: boolean;
  getLevel: (xp: number) => string;
  getWeeklyXP: () => number;
  awardLoginXP: () => Promise<void>;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userId: null,
      topicsStudied: {},
      quizScores: [],
      studyStreak: 1,
      xpTotal: 0,
      cloudXPEnabled: true,
      streakFreezes: 1,
      lastOpenedDate: new Date().toISOString().split('T')[0],
      pendingProgressSync: false,
      xpEvents: [],
      
      setUserId: (userId) => {
        const currentId = get().userId;
        if (userId !== currentId) {
          set({ userId, topicsStudied: {}, quizScores: [], studyStreak: 1, xpTotal: 0, cloudXPEnabled: true, streakFreezes: 1, xpEvents: [] });
          if (userId) {
            get().syncFromCloud();
          }
        }
      },

      syncFromCloud: async () => {
        const { userId } = get();
        if (!userId) return;

        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();

          // 1. Fetch User Progress
          const { data: progressData, error: progressError } = await client
            .from('user_progress')
            .select('subject_id, topic_id, completed_at')
            .eq('user_id', user.id);

          if (progressError) {
            logSupabaseError('user_progress', 'select', progressError);
            logError('PROGRESS_user_progress_fetch_failed', progressError);
          } else if (!progressData || progressData.length === 0) {
            console.warn('[PROGRESS] [EMPTY RESULT] user_progress', user.id);
          } else {
            const mappedProgress: Record<string, string[]> = {};
            (progressData || []).forEach(item => {
              if (!mappedProgress[item.subject_id]) mappedProgress[item.subject_id] = [];
              mappedProgress[item.subject_id].push(item.topic_id);
            });
            set({ topicsStudied: mappedProgress });
          }

          // 2. Fetch Quiz Sessions
          const { data: quizData, error: quizError } = await client
            .from('quiz_sessions')
            .select('score, total, date, topic_id, topics(title)')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (quizError) {
            logSupabaseError('quiz_sessions', 'select', quizError);
            logError('PROGRESS_quiz_sessions_fetch_failed', quizError);
          } else if (!quizData || quizData.length === 0) {
            console.warn('[PROGRESS] [EMPTY RESULT] quiz_sessions', user.id);
          } else {
            set({ quizScores: quizData.map(q => ({
              score: q.score,
              total: q.total,
              date: q.date,
              topic: (q.topics as any)?.title || q.topic_id
            })) });
          }

          // 3. Fetch Profile Stats (XP, Streaks)
          const { data: profile, error: profileError } = await client
            .from('profiles')
            // Do not assume optional columns exist (e.g. `xp_total`).
            // Local-first dominance: keep XP from local store; only pull streak/activity if available.
            .select('current_streak, streak_freezes, last_active_date')
            .eq('id', user.id)
            .maybeSingle();

          if (profileError) {
            logSupabaseError('profiles', 'select', profileError);
            logError('PROFILE_fetch_failed', profileError);
          } else if (!profile) {
            console.warn('[PROFILE] [EMPTY RESULT] profiles', user.id);
          } else {
            set({ 
              studyStreak: profile.current_streak ?? 1, 
              streakFreezes: profile.streak_freezes ?? 1,
              lastOpenedDate: profile.last_active_date || new Date().toISOString().split('T')[0]
            });
          }
        } catch (err) {
          logError('PROGRESS_syncFromCloud_failed', err);
        }
      },


      awardXP: async (amount, source = 'task') => {
        const { userId, xpTotal, xpEvents, cloudXPEnabled } = get();
        if (!userId) return;
        if (amount <= 0) return;

        const newXpTotal = xpTotal + amount;
        const newEvent: XPEvent = {
          value: amount,
          timestamp: new Date().toISOString(),
          source
        };

        set({ 
          xpTotal: newXpTotal,
          xpEvents: [...xpEvents, newEvent]
        });

        if (!cloudXPEnabled) return;

        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();
          // RLS: requires UPDATE policy restricting rows by auth.uid() = id.
          const { error } = await client.from('profiles').update({ xp_total: newXpTotal }).eq('id', user.id);
          if (error) {
            logSupabaseError('profiles', 'update', error);
            logError('PROFILE_xp_update_failed', error);
            // If schema doesn't have xp_total, disable cloud XP updates permanently for this session.
            const msg = (error as any)?.message ?? '';
            const code = (error as any)?.code ?? '';
            if (String(msg).includes('xp_total') || String(code) === '42703') {
              set({ cloudXPEnabled: false });
              void logEvent('WARN', 'cloud_xp_disabled_missing_column', { code, msg });
              return;
            }
            set({ pendingProgressSync: true });
          }
        } catch (err) {
          logError('PROFILE_xp_update_failed', err);
          set({ pendingProgressSync: true });
        }
      },

      markTopicDone: async (subjectId, topicId, topicName) => {
        const { userId, topicsStudied } = get();
        if (!userId) return;

        // Use topicId first (UUID passthrough), fall back to topicName for DB lookup
        const currentTopics = topicsStudied[subjectId] || [];
        const completionLabel = topicId || topicName;
        if (currentTopics.includes(completionLabel)) return;

        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();
          const resolvedTopicId = await resolveTopicIdOrThrow(topicId || topicName, subjectId);
          const row = {
            user_id: user.id,
            subject_id: subjectId,
            topic_id: resolvedTopicId,
            completed_at: new Date().toISOString()
          };
          assertRequiredWriteFields(row);

          const { error } = await client.from('user_progress').upsert([row], { onConflict: 'user_id,topic_id' });
          if (error) {
            logSupabaseError('user_progress', 'upsert', error);
            logError('PROGRESS_user_progress_insert_failed', error);
            set({ pendingProgressSync: true });
            throw error;
          }

          // Store the resolved UUID so cloud sync and local state are consistent
          set({
            topicsStudied: {
              ...get().topicsStudied,
              [subjectId]: [...(get().topicsStudied[subjectId] || []), resolvedTopicId]
            }
          });

          await get().updateStreak();
          await get().awardXP(10, 'task');
        } catch (err) {
          logError('PROGRESS_user_progress_insert_failed', err);
          set({ pendingProgressSync: true });
          throw err;
        }
      },
        
      addQuizScore: async (score, total, topic, subjectId, topicId) => {
        const { userId } = get();
        if (!userId) return;

        // Topic resolution failures must stop the write path.
        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();
          const resolvedTopicId = await resolveTopicIdOrThrow(topicId || topic, subjectId);
          const row = {
            user_id: user.id,
            subject_id: subjectId,
            topic_id: resolvedTopicId,
            score: score,
            total: total
          };
          assertRequiredWriteFields(row);

          const { error } = await client
            .from('quiz_sessions')
            .insert([row]);
          if (error) {
            logSupabaseError('quiz_sessions', 'insert', error);
            logError('PROGRESS_quiz_sessions_insert_failed', error);
            set({ pendingProgressSync: true });
            throw error;
          }

          const newScore = { date: new Date().toISOString(), score, total, topic };
          set({ quizScores: [...get().quizScores, newScore] });

          const percentage = (score / total) * 100;
          const xpToAward = percentage >= 80 ? 20 : percentage >= 50 ? 10 : 5;
          await get().awardXP(xpToAward, 'quiz');
          await get().updateStreak();
        } catch (err) {
          logError('PROGRESS_quiz_sessions_insert_failed', err);
          set({ pendingProgressSync: true });
          throw err;
        }
      },

      syncPendingProgress: async () => {
        const { userId, xpTotal, studyStreak, streakFreezes, lastOpenedDate } = get();
        if (!userId || !get().pendingProgressSync) return;

        console.log('[PROFILE] Syncing pending profile stats...');
        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();
          const { error } = await client.from('profiles').update({
            xp_total: xpTotal,
            current_streak: studyStreak,
            streak_freezes: streakFreezes,
            last_active_date: lastOpenedDate
          }).eq('id', user.id);

          if (error) {
            logSupabaseError('profiles', 'update', error);
            logError('PROFILE_pending_sync_failed', error);
            return;
          }
          set({ pendingProgressSync: false });
        } catch (err) {
          logError('PROFILE_pending_sync_failed', err);
        }
      },

      updateStreak: async () => {
        const { userId, studyStreak, lastOpenedDate, streakFreezes, xpTotal } = get();
        if (!userId) return;

        const today = new Date().toISOString().split('T')[0];
        if (lastOpenedDate === today) return;

        const lastOpenedTime = new Date(lastOpenedDate).getTime();
        const todayTime = new Date(today).getTime();
        const diffDays = Math.floor((todayTime - lastOpenedTime) / (1000 * 60 * 60 * 24));

        let newStreak = studyStreak;
        let newFreezes = streakFreezes;
        let awardedXP = 0;

        if (diffDays === 1) {
          // Normal daily progression (Task 2.2)
          newStreak += 1;
          awardedXP = 5; // Award 5 XP for daily login (Task 2.1)
          await get().awardXP(awardedXP, 'streak');
        } else if (diffDays > 1) {
          // Day missed
          if (newFreezes > 0) {
            // Use Freeze (Task 2.2)
            newFreezes -= 1;
            // Note: Streak remains same if frozen
          } else {
            // Reset Streak
            newStreak = 1;
          }
        }

        // Award new freeze every 7 days (Task 2.2)
        if (newStreak > 0 && newStreak % 7 === 0 && newStreak !== studyStreak) {
          newFreezes += 1;
        }

        set({ 
          studyStreak: newStreak, 
          lastOpenedDate: today, 
          streakFreezes: newFreezes
        });

        // Sync to Supabase Profiles
        try {
          const client = getSupabaseClient();
          const user = await getAuthenticatedUser();
          const { error } = await client.from('profiles').update({
            current_streak: newStreak,
            last_active_date: today,
            streak_freezes: newFreezes
          }).eq('id', user.id);
          if (error) {
            logSupabaseError('profiles', 'update', error);
            logError('PROFILE_streak_sync_failed', error);
            set({ pendingProgressSync: true });
          }
        } catch (err) {
          logError('PROFILE_streak_sync_failed', err);
          set({ pendingProgressSync: true });
        }
      },

      clearProgress: () =>
        set({
          topicsStudied: {},
          quizScores: [],
          studyStreak: 1,
          xpTotal: 0,
          streakFreezes: 1,
          lastOpenedDate: new Date().toISOString().split('T')[0],
          xpEvents: []
        }),

      getLevel: (xp) => {
        if (xp >= 1000) return 'Expert';
        if (xp >= 600) return 'Advanced';
        if (xp >= 300) return 'Scholar';
        if (xp >= 100) return 'Explorer';
        return 'Beginner';
      },

      getWeeklyXP: () => {
        const events = get().xpEvents;
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        
        return events
          .filter(e => new Date(e.timestamp) > sevenDaysAgo)
          .reduce((acc, e) => acc + e.value, 0);
      },
      
      awardLoginXP: async () => {
        const { lastOpenedDate } = get();
        const today = new Date().toISOString().split('T')[0];
        if (lastOpenedDate !== today) {
          await get().awardXP(5, 'streak');
        }
      }
    }),
    {
      name: 'easytutor-user-progress-v1', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
