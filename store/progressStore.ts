import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';

export interface QuizScore {
  date: string;
  score: number;
  total: number;
}

interface ProgressState {
  userId: string | null;
  topicsStudied: Record<string, string[]>;
  quizScores: QuizScore[];
  studyStreak: number;
  lastOpenedDate: string;
  
  setUserId: (id: string | null) => void;
  syncFromCloud: () => Promise<void>;
  markTopicDone: (subjectId: string, topic: string) => Promise<void>;
  addQuizScore: (score: number, total: number, subjectId?: string) => Promise<void>;
  updateStreak: () => void;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      userId: null,
      topicsStudied: {},
      quizScores: [],
      studyStreak: 1,
      lastOpenedDate: new Date().toISOString().split('T')[0],
      
      setUserId: (userId) => {
        const currentId = get().userId;
        if (userId !== currentId) {
          set({ userId, topicsStudied: {}, quizScores: [], studyStreak: 1 });
          if (userId) {
            get().syncFromCloud();
          }
        }
      },

      syncFromCloud: async () => {
        const { userId } = get();
        if (!userId) return;

        // Fetch User Progress
        const { data: progressData } = await supabase
          .from('user_progress')
          .select('subject_id, topic')
          .eq('user_id', userId);

        if (progressData) {
          const mappedProgress: Record<string, string[]> = {};
          progressData.forEach(item => {
            if (!mappedProgress[item.subject_id]) mappedProgress[item.subject_id] = [];
            mappedProgress[item.subject_id].push(item.topic);
          });
          set({ topicsStudied: mappedProgress });
        }

        // Fetch Quiz Sessions
        const { data: quizData } = await supabase
          .from('quiz_sessions')
          .select('score, total, date')
          .eq('user_id', userId)
          .order('date', { ascending: false });

        if (quizData) {
          set({ quizScores: quizData });
        }
      },

      markTopicDone: async (subjectId, topic) => {
        const { userId, topicsStudied } = get();
        if (!userId) return;

        const currentTopics = topicsStudied[subjectId] || [];
        if (currentTopics.includes(topic)) return;

        set({
          topicsStudied: {
            ...topicsStudied,
            [subjectId]: [...currentTopics, topic]
          }
        });

        // Background sync to Supabase
        await supabase.from('user_progress').insert({
          user_id: userId,
          subject_id: subjectId,
          topic: topic
        });
      },
        
      addQuizScore: async (score, total, subjectId) => {
        const { userId, quizScores } = get();
        if (!userId) return;

        const newScore = { date: new Date().toISOString(), score, total };
        set({ quizScores: [...quizScores, newScore] });

        // Background sync to Supabase
        await supabase.from('quiz_sessions').insert({
          user_id: userId,
          subject_id: subjectId ?? 'general',
          score,
          total
        });
      },
        
      updateStreak: () =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          if (state.lastOpenedDate === today) return state;
          
          const lastOpenedTime = new Date(state.lastOpenedDate).getTime();
          const todayTime = new Date(today).getTime();
          const diffDays = Math.floor((todayTime - lastOpenedTime) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            return { studyStreak: state.studyStreak + 1, lastOpenedDate: today };
          } else if (diffDays > 1) {
            return { studyStreak: 1, lastOpenedDate: today };
          }
          return state;
        }),

      clearProgress: () =>
        set({
          topicsStudied: {},
          quizScores: [],
          studyStreak: 1,
          lastOpenedDate: new Date().toISOString().split('T')[0],
        }),
    }),
    {
      name: 'easytutor-user-progress-v1', 
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);

