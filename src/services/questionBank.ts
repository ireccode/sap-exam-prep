import { Question } from '../types/question';
import { useProgressStore } from '@/store/useProgressStore';
import { EncryptionService } from './encryptionService';

export interface QuestionFilters {
  categories?: string[];
  isPremium?: boolean;
  difficulty?: number;
}

class QuestionBankService {
  private basicQuestions: Question[] = [];
  private premiumQuestions: Question[] = [];
  private initialized = false;
  private encryptionService: EncryptionService;

  constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  async initialize() {
    if (this.initialized) return;
    
    try {
      // Load and decrypt basic questions
      const basicResponse = await fetch('/btp_query_bank.encrypted');
      if (!basicResponse.ok) {
        throw new Error('Failed to load basic questions');
      }
      const encryptedBasicData = await basicResponse.text();
      
      try {
        const decryptedBasicQuestions = await this.encryptionService.decryptQuestions(encryptedBasicData, true);
        this.basicQuestions = decryptedBasicQuestions.map(q => ({
          ...q,
          isPremium: false
        }));
        console.log('Successfully loaded and decrypted basic questions');
      } catch (decryptError) {
        console.error('Failed to decrypt basic questions:', decryptError);
        this.basicQuestions = [];
      }

      // Load and decrypt premium questions
      const premiumResponse = await fetch('/premium_btp_query_bank.encrypted');
      if (!premiumResponse.ok) {
        throw new Error('Failed to load premium questions');
      }
      const encryptedPremiumData = await premiumResponse.text();
      
      try {
        const decryptedPremiumQuestions = await this.encryptionService.decryptQuestions(encryptedPremiumData, false);
        this.premiumQuestions = decryptedPremiumQuestions.map(q => ({
          ...q,
          isPremium: true
        }));
        console.log('Successfully loaded and decrypted premium questions');
      } catch (decryptError) {
        console.error('Failed to decrypt premium questions:', decryptError);
        this.premiumQuestions = [];
      }

      this.initialized = true;
    } catch (error) {
      console.error('Failed to load questions:', error);
      this.basicQuestions = [];
      this.premiumQuestions = [];
      throw error;
    }
  }

  getAllQuestions(filters: QuestionFilters = {}): Question[] {
    if (!this.initialized) {
      console.warn('QuestionBank not initialized. Call initialize() first.');
      return [];
    }

    // Start with basic questions
    let questions = [...this.basicQuestions];
    
    // Add premium questions if requested
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