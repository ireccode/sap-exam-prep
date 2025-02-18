export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number | number[];  // Can be single number or array of numbers for multiple correct answers
  requiredAnswers?: number;  // Number of answers that should be selected, defaults to 1 if not specified
  explanation: string;
  difficulty: number;
  isPremium?: boolean;
  tags?: string[];
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