export interface Question {
  id: string;
  category: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
  difficulty: number;
  tags: string[];
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