import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface RoadmapState {
  checkedTasks: Record<number, string[]>;
  toggleTask: (day: number, task: string) => void;
}

export const useRoadmapStore = create<RoadmapState>()(
  persist(
    (set) => ({
      checkedTasks: {},
      toggleTask: (day, task) =>
        set((state) => {
          const dayTasks = state.checkedTasks[day] || [];
          const isChecked = dayTasks.includes(task);
          
          return {
            checkedTasks: {
              ...state.checkedTasks,
              [day]: isChecked
                ? dayTasks.filter(t => t !== task)
                : [...dayTasks, task]
            }
          };
        }),
    }),
    {
      name: 'easytutor-roadmap-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
