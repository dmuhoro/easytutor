import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface RoadmapDay {
  day: number;
  title: string;
  tasks: string[];
}

export interface CustomRoadmap {
  id: string;
  topic: string;
  title: string;
  days: RoadmapDay[];
  createdAt: string;
}

export type LearningMode = 'high_school' | 'university' | 'self_directed';

interface RoadmapState {
  userId: string | null;
  roadmaps: CustomRoadmap[];
  // topicId -> dayNumber -> taskArray
  checkedTasks: Record<string, Record<number, string[]>>;
  
  // New multi-portal fields (Section 7)
  learningMode: LearningMode | null;
  onboardingComplete: boolean;
  subjectId: string | null;
  topicId: string | null;
  
  setUserId: (id: string | null) => void;
  addRoadmap: (roadmap: CustomRoadmap) => void;
  toggleTask: (roadmapId: string, day: number, task: string) => void;
  removeRoadmap: (roadmapId: string) => void;
  clearRoadmaps: () => void;
  
  // New setters
  setLearningMode: (mode: LearningMode) => void;
  setOnboardingComplete: (val: boolean) => void;
  setSubjectId: (id: string | null) => void;
  setTopicId: (id: string | null) => void;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set, get) => ({
      userId: null,
      roadmaps: [],
      checkedTasks: {},
      
      learningMode: null,
      onboardingComplete: false,
      subjectId: null,
      topicId: null,
      
      setUserId: (userId) => {
        if (userId !== get().userId) {
          set({ userId, roadmaps: [], checkedTasks: {}, onboardingComplete: false, learningMode: null });
        }
      },
      
      setLearningMode: (learningMode) => set({ learningMode }),
      setOnboardingComplete: (onboardingComplete) => set({ onboardingComplete }),
      setSubjectId: (subjectId) => set({ subjectId }),
      setTopicId: (topicId) => set({ topicId }),

      addRoadmap: (roadmap) => {
        set((state) => ({
          roadmaps: [roadmap, ...state.roadmaps],
          checkedTasks: {
            ...state.checkedTasks,
            [roadmap.id]: {}
          }
        }));
      },

      toggleTask: (roadmapId, day, task) =>
        set((state) => {
          if (!state.userId) return state;
          
          const roadmapProgress = state.checkedTasks[roadmapId] || {};
          const dayTasks = roadmapProgress[day] || [];
          const isChecked = dayTasks.includes(task);
          
          return {
            checkedTasks: {
              ...state.checkedTasks,
              [roadmapId]: {
                ...roadmapProgress,
                [day]: isChecked
                  ? dayTasks.filter(t => t !== task)
                  : [...dayTasks, task]
              }
            }
          };
        }),
      
      removeRoadmap: (roadmapId) => {
        set((state) => {
          const { [roadmapId]: _, ...remainingTasks } = state.checkedTasks;
          return {
            roadmaps: state.roadmaps.filter(r => r.id !== roadmapId),
            checkedTasks: remainingTasks
          };
        });
      },
        
      clearRoadmaps: () => set({ roadmaps: [], checkedTasks: {} }),
    }),
    {
      name: 'easytutor-multi-roadmap-v1',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);


