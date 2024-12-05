import { Question } from '../types/question';

export interface QuestionFilters {
  categories?: string[];
  isPremium?: boolean;
  difficulty?: number;
}

class QuestionBankService {
  private basicQuestions: Question[] = [];
  private premiumQuestions: Question[] = [];
  private initialized = false;

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load basic questions
      const basicResponse = await fetch('/basic_btp_query_bank.json');
      const basicData = await basicResponse.json();
      this.basicQuestions = basicData.questions.map((q: any) => ({
        ...q,
        isPremium: false
      }));
       console.log('Loaded basic questions:', this.basicQuestions.length); // Debug log

      // Load premium questions
      const premiumResponse = await fetch('/premium_btp_query_bank.json');
      const premiumData = await premiumResponse.json();
      this.premiumQuestions = premiumData.questions.map((q: any) => ({
        ...q,
        isPremium: true
      }));
       console.log('Loaded premium questions:', this.premiumQuestions.length); // Debug log

      this.initialized = true;
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.basicQuestions = [];
      this.premiumQuestions = [];
    }
  }

  getAllQuestions(includesPremium: boolean = false): Question[] {
    return includesPremium 
      ? [...this.basicQuestions, ...this.premiumQuestions]
      : this.basicQuestions;
  }

  getQuestionsByCategory(category: string, filters: QuestionFilters = {}): Question[] {
    const allQuestions = this.getAllQuestions(filters.isPremium);
    return allQuestions.filter(q => 
      q.category === category &&
      (!filters.difficulty || q.difficulty === filters.difficulty)
    );
  }

  getCategories(includesPremium: boolean = false): string[] {
    const allQuestions = this.getAllQuestions(includesPremium);
    return Array.from(new Set(allQuestions.map(q => q.category))).sort();
  }

  getRandomQuestions(count: number, filters: QuestionFilters = {}): Question[] {
  if (!this.initialized || (this.basicQuestions.length === 0 && this.premiumQuestions.length === 0)) {
    console.warn('Question bank not initialized or empty');
    return [];
  }

  const allQuestions = this.getAllQuestions(filters.isPremium);
  console.log('Available questions for random selection:', allQuestions.length); // Debug log
  
  let filteredQuestions = allQuestions.filter(q => 
    (!filters.categories?.length || filters.categories.includes(q.category))
  );

  return this.shuffleArray(filteredQuestions).slice(0, Math.min(count, filteredQuestions.length));
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }
}

export const questionBank = new QuestionBankService();