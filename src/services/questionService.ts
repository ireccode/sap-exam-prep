import { Question, UserProgress } from '../types/question';

export class QuestionService {
  private questions: Question[] = [];
  private userProgress: Map<string, UserProgress> = new Map();

  async getAdaptiveQuestions(userProgress: UserProgress): Promise<Question[]> {
    // Implement adaptive question selection based on user progress
    const completedQuestions = new Set(userProgress.completedQuestions);
    
    return this.questions
      .filter(q => !completedQuestions.has(q.id))
      .sort((a, b) => {
        // Sort by difficulty and user performance
        const userLevel = this.calculateUserLevel(userProgress);
        const diffA = Math.abs(a.difficulty - userLevel);
        const diffB = Math.abs(b.difficulty - userLevel);
        return diffA - diffB;
      })
      .slice(0, 10);
  }

  private calculateUserLevel(userProgress: UserProgress): number {
    if (userProgress.scores.length === 0) return 1;
    
    const recentScores = userProgress.scores
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, 10);
    
    const averageScore = recentScores.reduce((sum, score) => sum + score.score, 0) / recentScores.length;
    return Math.min(Math.max(averageScore, 1), 5);
  }
}