import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CategoryProgress {
  completedCount: number;
  correctCount: number;
  lastAttempted?: Date;
}

interface ProgressState {
  categoryProgress: Record<string, CategoryProgress>;
  updateProgress: (category: string, isCorrect: boolean) => void;
  getCategoryProgress: (category: string) => CategoryProgress;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      categoryProgress: {},

      updateProgress: (category, isCorrect) => set(state => {
        const current = state.categoryProgress[category] || {
          completedCount: 0,
          correctCount: 0
        };

        return {
          categoryProgress: {
            ...state.categoryProgress,
            [category]: {
              completedCount: current.completedCount + 1,
              correctCount: current.correctCount + (isCorrect ? 1 : 0),
              lastAttempted: new Date()
            }
          }
        };
      }),

      getCategoryProgress: (category) => {
        return get().categoryProgress[category] || {
          completedCount: 0,
          correctCount: 0
        };
      }
    }),
    {
      name: 'exam-progress'
    }
  )
);