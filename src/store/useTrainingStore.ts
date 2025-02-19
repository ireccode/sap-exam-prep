import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Question } from '../types/question';

interface TrainingState {
  selectedCategory: string | null;
  questions: Question[];
  currentQuestionIndex: number;
  selectedAnswers: Record<string, number | number[]>;
  isSubmitted: boolean;
  previousPath: string | null;
}

interface TrainingActions {
  setSelectedCategory: (category: string | null) => void;
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestionIndex: (index: number) => void;
  setAnswer: (questionId: string, answerId: number) => void;
  setIsSubmitted: (value: boolean) => void;
  setPreviousPath: (path: string | null) => void;
  resetTraining: () => void;
}

export const useTrainingStore = create<TrainingState & TrainingActions>()(
  persist(
    (set, get) => ({
      selectedCategory: null,
      questions: [],
      currentQuestionIndex: 0,
      selectedAnswers: {},
      isSubmitted: false,
      previousPath: null,

      setSelectedCategory: (category) => set({ selectedCategory: category }),
      setQuestions: (questions) => set({ questions }),
      setCurrentQuestionIndex: (index) => set({ currentQuestionIndex: index }),
      setPreviousPath: (path) => set({ previousPath: path }),
      setIsSubmitted: (value) => set({ isSubmitted: value }),

      setAnswer: (questionId, answerId) =>
        set((state) => {
          const question = state.questions.find(q => q.id === questionId);
          if (!question) return state;

          const correctAnswers = Array.isArray(question.correctAnswer) ? question.correctAnswer : [question.correctAnswer];
          const currentAnswers = Array.isArray(state.selectedAnswers[questionId]) 
            ? state.selectedAnswers[questionId] as number[] 
            : state.selectedAnswers[questionId] !== undefined 
              ? [state.selectedAnswers[questionId] as number] 
              : [];

          // If answer is already selected, remove it (explicit deselection)
          if (currentAnswers.includes(answerId)) {
            const newAnswers = currentAnswers.filter(a => a !== answerId);
            // If no answers left, remove the entry completely
            if (newAnswers.length === 0) {
              const { [questionId]: _, ...rest } = state.selectedAnswers;
              return { selectedAnswers: rest };
            }
            // Otherwise keep the array of remaining answers
            return {
              selectedAnswers: {
                ...state.selectedAnswers,
                [questionId]: correctAnswers.length === 1 ? newAnswers[0] : newAnswers
              }
            };
          }

          // For all answer questions, add the new answer
          return {
            selectedAnswers: {
              ...state.selectedAnswers,
              [questionId]: [...currentAnswers, answerId]
            }
          };
        }),

      resetTraining: () => set({
        selectedCategory: null,
        questions: [],
        currentQuestionIndex: 0,
        selectedAnswers: {},
        isSubmitted: false,
        previousPath: null,
      }),
    }),
    {
      name: 'training-state',
      partialize: (state) => ({
        selectedCategory: state.selectedCategory,
        questions: state.questions,
        currentQuestionIndex: state.currentQuestionIndex,
        selectedAnswers: state.selectedAnswers,
        isSubmitted: state.isSubmitted,
        previousPath: state.previousPath
      })
    }
  )
); 