import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CategoryProgress {
  completedCount: number;
  correctCount: number;
  totalCount: number;
  lastAttempted: string;
  answeredQuestions: Record<string, boolean>;
  weakAreas: string[];
  strengths: string[];
  totalAttempts: number;
  currentSessionCount: number;
}

const defaultProgress: CategoryProgress = {
  completedCount: 0,
  correctCount: 0,
  totalCount: 0,
  lastAttempted: '',
  answeredQuestions: {},
  weakAreas: [],
  strengths: [],
  totalAttempts: 0,
  currentSessionCount: 0
};

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
}

interface ProgressActions {
  updateProgress: (category: string, questionId: string, isCorrect: boolean) => void;
  getCategoryProgress: (category: string) => CategoryProgress;
  startNewTrainingSession: (category: string, questionCount: number) => void;
  addExamResult: (result: ExamHistory) => void;
  getWeakAreas: () => string[];
  getStrengths: () => string[];
  reset: () => void;
}

export const useProgressStore = create<ProgressState & ProgressActions>()(
  persist(
    (set, get) => ({
      categoryProgress: {},
      examHistory: [],

      getCategoryProgress: (category: string) => {
        return get().categoryProgress[category] || defaultProgress;
      },

      updateProgress: (category: string, questionId: string, isCorrect: boolean) => {
        set(state => {
          const currentProgress = state.categoryProgress[category] || defaultProgress;
          const updatedProgress: CategoryProgress = {
            ...currentProgress,
            completedCount: currentProgress.completedCount + 1,
            correctCount: isCorrect ? currentProgress.correctCount + 1 : currentProgress.correctCount,
            currentSessionCount: currentProgress.currentSessionCount + 1,
            lastAttempted: new Date().toISOString(),
            answeredQuestions: {
              ...currentProgress.answeredQuestions,
              [questionId]: isCorrect
            }
          };

          // Only update totalAttempts when we complete all questions
          if (updatedProgress.currentSessionCount === currentProgress.totalCount) {
            updatedProgress.totalAttempts = (currentProgress.totalAttempts || 0) + 1;
            // Don't reset currentSessionCount here - it should persist until new session starts
          }

          return {
            categoryProgress: {
              ...state.categoryProgress,
              [category]: updatedProgress
            }
          };
        });
      },

      startNewTrainingSession: (category: string, questionCount: number) => {
        set(state => {
          const currentProgress = state.categoryProgress[category] || defaultProgress;
          
          // Only increment totalAttempts if previous session was completed
          const wasLastSessionCompleted = currentProgress.currentSessionCount === currentProgress.totalCount;
          const newTotalAttempts = wasLastSessionCompleted 
            ? currentProgress.totalAttempts 
            : currentProgress.totalAttempts;

          return {
            categoryProgress: {
              ...state.categoryProgress,
              [category]: {
                ...currentProgress,
                lastAttempted: new Date().toISOString(),
                totalCount: questionCount,
                currentSessionCount: 0, // Reset session count for new session
                totalAttempts: newTotalAttempts
              }
            }
          };
        });
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
      },

      reset: () => set(() => ({
        categoryProgress: {},
        examHistory: []
      }))
    }),
    {
      name: 'exam-progress'
    }
  )
);