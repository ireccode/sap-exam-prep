import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CategoryProgress {
  completedCount: number;
  correctCount: number;
  lastAttempted?: Date;
  answeredQuestions: Record<string, boolean>; // questionId -> correct/incorrect
  weakAreas: string[]; // Topics/categories where performance is below threshold
  strengths: string[]; // Topics/categories where performance is above threshold
}

interface ExamHistory {
  id: string;
  date: Date;
  category?: string;
  score: number;
  totalQuestions: number;
  timeSpent: number;
  questionResults: Record<string, boolean>;
}

interface ProgressState {
  categoryProgress: Record<string, CategoryProgress>;
  examHistory: ExamHistory[];
  updateProgress: (category: string, questionId: string, isCorrect: boolean) => void;
  getCategoryProgress: (category: string) => CategoryProgress;
  addExamResult: (result: ExamHistory) => void;
  getWeakAreas: () => string[];
  getStrengths: () => string[];
}

interface ProgressStore {
  categoryProgress: Record<string, {
    completedCount: number;
    correctCount: number;
    attempts: Record<string, boolean>;
  }>;
  resetProgress: () => void;
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      categoryProgress: {},
      examHistory: [],

      updateProgress: (category, questionId, isCorrect) => set(state => {
        const current = state.categoryProgress[category] || {
          completedCount: 0,
          correctCount: 0,
          answeredQuestions: {},
          weakAreas: [],
          strengths: []
        };

        const updatedProgress = {
          ...current,
          completedCount: current.completedCount + 1,
          correctCount: current.correctCount + (isCorrect ? 1 : 0),
          lastAttempted: new Date(),
          answeredQuestions: {
            ...current.answeredQuestions,
            [questionId]: isCorrect
          }
        };

        // Calculate performance percentage
        const performance = (updatedProgress.correctCount / updatedProgress.completedCount) * 100;
        
        // Update strengths and weak areas
        if (performance < 70) {
          updatedProgress.weakAreas = [...new Set([...current.weakAreas, category])];
          updatedProgress.strengths = current.strengths.filter(c => c !== category);
        } else if (performance > 85) {
          updatedProgress.strengths = [...new Set([...current.strengths, category])];
          updatedProgress.weakAreas = current.weakAreas.filter(c => c !== category);
        }

        return {
          categoryProgress: {
            ...state.categoryProgress,
            [category]: updatedProgress
          }
        };
      }),

      getCategoryProgress: (category) => {
        return get().categoryProgress[category] || {
          completedCount: 0,
          correctCount: 0,
          answeredQuestions: {},
          weakAreas: [],
          strengths: []
        };
      },

      addExamResult: (result) => set(state => ({
        examHistory: [...state.examHistory, result]
      })),

      getWeakAreas: () => {
        const progress = get().categoryProgress;
        return Object.entries(progress)
          .filter(([_, data]) => 
            (data.correctCount / data.completedCount) < 0.7 && 
            data.completedCount >= 5
          )
          .map(([category]) => category);
      },

      getStrengths: () => {
        const progress = get().categoryProgress;
        return Object.entries(progress)
          .filter(([_, data]) => 
            (data.correctCount / data.completedCount) > 0.85 && 
            data.completedCount >= 5
          )
          .map(([category]) => category);
      }
    }),
    {
      name: 'exam-progress'
    }
  )
);