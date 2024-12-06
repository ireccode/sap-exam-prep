import { create } from 'zustand';
import { Question } from '../types/question';

interface ExamState {
  questions: Question[];
  currentQuestion: Question | null;
  selectedAnswers: Record<string, number>;
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
  setAnswer: (questionId: string, answer: number) => void;
  startExam: (config: { duration: number; questionCount: number }) => void;
  endExam: () => void;
  setTimeRemaining: (time: number) => void;
  setIsSubmitted: (value: boolean) => void;
  setCorrectAnswers: (count: number) => void;
  calculateScore: () => void;
  decrementTimer: () => void;
}

export const useExamStore = create<ExamState & ExamActions>((set) => ({
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
  setAnswer: (questionId, answer) =>
    set((state) => ({
      selectedAnswers: { ...state.selectedAnswers, [questionId]: answer },
    })),
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
    const correct = questions.filter(q => 
      selectedAnswers[q.id] === q.correctAnswer
    ).length;
    set({ correctAnswers: correct, isSubmitted: true });
  },
  decrementTimer: () => set((state) => ({ 
    timeRemaining: Math.max(0, state.timeRemaining - 1) 
  })),  
}));