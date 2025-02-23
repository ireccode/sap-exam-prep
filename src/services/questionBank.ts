import { Question } from '../types/question';
import { useProgressStore } from '@/store/useProgressStore';

export interface QuestionFilters {
  categories?: string[];
  isPremium?: boolean;
  difficulty?: number;
}

class QuestionBankService {
  private basicQuestions: Question[] = [];
  private premiumQuestions: Question[] = [];
  private initialized = false;
  private encryptionKey: string | null = null;

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

      // Load premium questions if encryption key is available
      const encryptionKey = import.meta.env.VITE_PREMIUM_ENCRYPTION_KEY;
      if (encryptionKey) {
        this.encryptionKey = encryptionKey;
        try {
          const premiumResponse = await fetch('/premium_btp_query_bank.json');
          const premiumData = await premiumResponse.json();
          // TODO: Implement decryption when encryption is added
          this.premiumQuestions = premiumData.questions.map((q: any) => ({
            ...q,
            isPremium: true
          }));
        } catch (error) {
          console.error('Failed to load premium questions:', error);
          this.premiumQuestions = [];
        }
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.basicQuestions = [];
      this.premiumQuestions = [];
    }
  }

  getAllQuestions(filters: QuestionFilters = {}): Question[] {
    // Filter questions based on premium status
    let questions = this.basicQuestions;
    if (filters.isPremium) {
      questions = [...questions, ...this.premiumQuestions];
    }

    // Apply category filters if specified
    if (filters.categories?.length) {
      questions = questions.filter(q => filters.categories!.includes(q.category));
    }

    // Apply difficulty filter if specified
    if (filters.difficulty !== undefined) {
      questions = questions.filter(q => q.difficulty === filters.difficulty);
    }

    return questions;
  }

  getQuestionsByCategory(category: string, filters: QuestionFilters = {}): Question[] {
    const allQuestions = this.getAllQuestions(filters);
    return allQuestions.filter(q => q.category === category);
  }

  getCategories(filters: QuestionFilters = {}): string[] {
    const allQuestions = this.getAllQuestions(filters);
    return Array.from(new Set(allQuestions.map(q => q.category))).sort();
  }

  getCategoryCount(category: string, filters: QuestionFilters = {}): number {
    return this.getQuestionsByCategory(category, filters).length;
  }

  getAdaptiveQuestions(count: number, filters: QuestionFilters = {}): Question[] {
    const progressStore = useProgressStore.getState();
    const weakAreas = progressStore.getWeakAreas();
    const allQuestions = this.getAllQuestions(filters);
    
    // Prioritize questions from weak areas
    const weakAreaQuestions = allQuestions.filter(q => 
      weakAreas.includes(q.category) &&
      (!filters.categories?.length || filters.categories.includes(q.category))
    );

    // Get remaining questions if needed
    const remainingCount = count - weakAreaQuestions.length;
    let otherQuestions: Question[] = [];
    
    if (remainingCount > 0) {
      otherQuestions = allQuestions.filter(q => 
        !weakAreas.includes(q.category) &&
        (!filters.categories?.length || filters.categories.includes(q.category))
      );
    }

    // Combine and shuffle
    const combinedQuestions = [
      ...this.shuffleArray(weakAreaQuestions),
      ...this.shuffleArray(otherQuestions)
    ];

    return combinedQuestions.slice(0, count);
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