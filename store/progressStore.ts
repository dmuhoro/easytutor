import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface QuizScore {
  date: string;
  score: number;
  total: number;
}

interface ProgressState {
  topicsStudied: Record<string, string[]>;
  quizScores: QuizScore[];
  studyStreak: number;
  lastOpenedDate: string;
  markTopicDone: (subjectId: string, topic: string) => void;
  addQuizScore: (score: number, total: number) => void;
  updateStreak: () => void;
  clearProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set) => ({
      topicsStudied: {},
      quizScores: [],
      studyStreak: 1,
      lastOpenedDate: new Date().toISOString().split('T')[0],
      
      markTopicDone: (subjectId, topic) => 
        set((state) => {
          const currentTopics = state.topicsStudied[subjectId] || [];
          if (currentTopics.includes(topic)) return state;
          
          return {
            topicsStudied: {
              ...state.topicsStudied,
              [subjectId]: [...currentTopics, topic]
            }
          };
        }),
        
      addQuizScore: (score, total) =>
        set((state) => ({
          quizScores: [
            ...state.quizScores, 
            { date: new Date().toISOString(), score, total }
          ]
        })),
        
      updateStreak: () =>
        set((state) => {
          const today = new Date().toISOString().split('T')[0];
          if (state.lastOpenedDate === today) return state; // Already updated today
          
          const lastOpenedTime = new Date(state.lastOpenedDate).getTime();
          const todayTime = new Date(today).getTime();
          const diffDays = Math.floor((todayTime - lastOpenedTime) / (1000 * 60 * 60 * 24));
          
          if (diffDays === 1) {
            return {
              studyStreak: state.studyStreak + 1,
              lastOpenedDate: today,
            };
          } else if (diffDays > 1) {
            return {
              studyStreak: 1, // Reset streak
              lastOpenedDate: today,
            };
          }
          
          return state; // Should not reach here
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
      name: 'easytutor-progress-v3', // bump version to avoid type mismatch
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
