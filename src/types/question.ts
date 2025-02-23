export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number | number[];
  correctAnswers?: number[]; // For multiple answer questions
  explanation: string;
  difficulty: number;
  isPremium?: boolean;
  tags?: string[];
  requiredAnswers?: number;
}

export interface UserProgress {
  userId: string;
  completedQuestions: string[];
  scores: {
    questionId: string;
    score: number;
    timestamp: Date;
  }[];
}