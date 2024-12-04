import { create } from 'zustand';
import { Question, UserProgress } from '../types/question';

interface ExamStore {
  currentQuestion: Question | null;
  questions: Question[];
  userProgress: UserProgress;
  isLoading: boolean;
  setCurrentQuestion: (question: Question) => void;
  setQuestions: (questions: Question[]) => void;
  updateProgress: (questionId: string, score: number) => void;
  loadQuestions: () => Promise<void>;
}

export const useExamStore = create<ExamStore>((set, get) => ({
  currentQuestion: null,
  questions: [],
  userProgress: {
    userId: 'default',
    completedQuestions: [],
    scores: [],
  },
  isLoading: false,

  setCurrentQuestion: (question) => set({ currentQuestion: question }),
  
  setQuestions: (questions) => set({ questions }),
  
  updateProgress: (questionId, score) => {
    const { userProgress } = get();
    set({
      userProgress: {
        ...userProgress,
        completedQuestions: [...userProgress.completedQuestions, questionId],
        scores: [
          ...userProgress.scores,
          {
            questionId,
            score,
            timestamp: new Date(),
          },
        ],
      },
    });
  },

  loadQuestions: async () => {
    set({ isLoading: true });
    try {
      // TODO: Replace with actual API call
      const mockQuestions: Question[] = [
        {
          id: "1",
          category: "Architecture",
          question: "What is the primary advantage of using SAP's cloud platform for enterprise applications?",
          options: [
            "Lower initial infrastructure costs",
            "Increased system complexity",
            "Reduced scalability options",
            "Higher maintenance requirements"
          ],
          correctAnswer: 0,
          explanation: "SAP's cloud platform significantly reduces initial infrastructure costs by eliminating the need for on-premises hardware and providing pay-as-you-go pricing models.",
          difficulty: 2,
          tags: ["cloud", "infrastructure", "costs"]
        },
        // Add more mock questions here
      ];
      set({ questions: mockQuestions });
    } finally {
      set({ isLoading: false });
    }
  },
}));