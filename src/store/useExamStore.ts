import { create } from 'zustand';
import { Question } from '../types/question';

interface ExamState {
  questions: Question[];
  currentQuestion: Question | null;
  selectedAnswers: Record<string, number | number[]>;
  examConfig: {
    duration: number;
    questionCount: number;
  };
  isLoading: boolean;
  examStarted: boolean;
  timeRemaining: number;
  isSubmitted: boolean;
  correctAnswers: number;
}

interface ExamActions {
  setQuestions: (questions: Question[]) => void;
  setCurrentQuestion: (question: Question | null) => void;
  setAnswer: (questionId: string, answerId: number) => void;
  startExam: (config: { duration: number; questionCount: number }) => void;
  endExam: () => void;
  setTimeRemaining: (time: number) => void;
  setIsSubmitted: (value: boolean) => void;
  setCorrectAnswers: (count: number) => void;
  calculateScore: () => void;
  decrementTimer: () => void;
}

export const useExamStore = create<ExamState & ExamActions>((set, get) => ({
  questions: [],
  currentQuestion: null,
  selectedAnswers: {},
  examConfig: {
    duration: 10,
    questionCount: 10,
  },
  isLoading: false,
  examStarted: false,
  timeRemaining: 0,
  isSubmitted: false,
  correctAnswers: 0,

  setQuestions: (questions) => set({ questions }),
  setCurrentQuestion: (question) => set({ currentQuestion: question }),
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
  startExam: (config) =>
    set({
      examStarted: true,
      examConfig: config,
      timeRemaining: config.duration,
      isSubmitted: false,
      correctAnswers: 0,
    }),
  endExam: () => set({ examStarted: false, selectedAnswers: {}, isSubmitted: false, correctAnswers: 0,}),
  setTimeRemaining: (time) => set({ timeRemaining: time }),
  setIsSubmitted: (value) => set({ isSubmitted: value }),
  setCorrectAnswers: (count) => set({ correctAnswers: count }),
  calculateScore: () => {
    const { questions, selectedAnswers } = get();
    const correct = questions.filter(q => {
      const answers = selectedAnswers[q.id];
      if (answers === undefined) return false;
      
      const selectedAnswerArray = Array.isArray(answers) ? answers : [answers];
      const correctAnswers = Array.isArray(q.correctAnswer) ? q.correctAnswer : [q.correctAnswer];
      return selectedAnswerArray.length === correctAnswers.length &&
        selectedAnswerArray.every((answer: number) => correctAnswers.includes(answer));
    }).length;
    set({ correctAnswers: correct, isSubmitted: true });
  },
  decrementTimer: () => set((state) => ({ 
    timeRemaining: Math.max(0, state.timeRemaining - 1) 
  })),  
}));