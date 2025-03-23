import { Question } from '../types/question';
import { useProgressStore } from '@/store/useProgressStore';
import { EncryptionService } from './encryptionService';

export interface QuestionFilters {
  categories?: string[];
  isPremium?: boolean;
  difficulty?: number;
}

export class QuestionBankService {
  private static instance: QuestionBankService;
  private basicQuestions: Question[] = [];
  private premiumQuestions: Question[] = [];
  private isLoading = false;
  private hasLoaded = false;
  private encryptionService: EncryptionService;

  private constructor() {
    this.encryptionService = EncryptionService.getInstance();
  }

  public static getInstance(): QuestionBankService {
    if (!QuestionBankService.instance) {
      QuestionBankService.instance = new QuestionBankService();
    }
    return QuestionBankService.instance;
  }

  public async loadQuestions(isPremium: boolean = false): Promise<void> {
    if (this.isLoading) return;
    this.isLoading = true;

    try {
      // Load basic questions if not already loaded
      if (this.basicQuestions.length === 0) {
        try {
          const basicEncryptedData = await this.fetchEncryptedData('/basic_btp_query_bank.encrypted');
          this.basicQuestions = await this.encryptionService.decryptQuestions(basicEncryptedData, false);
        } catch (error) {
          console.error('Error loading basic questions:', error);
          
          // Use sample questions as fallback
          console.log('Using sample basic questions as fallback');
          this.basicQuestions = this.getSampleBasicQuestions();
        }
      }

      // Load premium questions if user is premium and not already loaded
      if (isPremium && this.premiumQuestions.length === 0) {
        try {
          const premiumEncryptedData = await this.fetchEncryptedData('/premium_btp_query_bank.encrypted');
          this.premiumQuestions = await this.encryptionService.decryptQuestions(premiumEncryptedData, true);
        } catch (error) {
          console.error('Error loading premium questions:', error);
          
          // Use sample questions as fallback
          console.log('Using sample premium questions as fallback');
          this.premiumQuestions = this.getSamplePremiumQuestions();
        }
      }

      this.hasLoaded = true;
    } catch (error) {
      console.error('Error loading questions:', error);
      
      // Even if there's an error, set some sample questions so the app can function
      if (this.basicQuestions.length === 0) {
        this.basicQuestions = this.getSampleBasicQuestions();
      }
      
      if (isPremium && this.premiumQuestions.length === 0) {
        this.premiumQuestions = this.getSamplePremiumQuestions();
      }
      
      this.hasLoaded = true;
    } finally {
      this.isLoading = false;
    }
  }

  private async fetchEncryptedData(path: string): Promise<string> {
    try {
      // Ensure we're using the correct path
      const fullPath = path.startsWith('/') ? path : `/${path}`;
      console.log(`Fetching encrypted data from ${fullPath}`);
      
      const response = await fetch(fullPath);
      
      // Check content type for HTML
      const contentType = response.headers.get('content-type');
      console.log(`Content type for ${fullPath}: ${contentType}`);
      
      if (contentType && contentType.includes('text/html')) {
        console.error(`Received HTML content type from ${fullPath}`);
        throw new Error('Received HTML instead of encrypted data');
      }
      
      if (!response.ok) {
        throw new Error(`Failed to fetch encrypted data: ${response.statusText}`);
      }
      
      const text = await response.text();
      
      // Check if content looks like HTML
      if (text.trim().startsWith('<!DOCTYPE') || text.trim().startsWith('<html')) {
        console.error(`Received HTML content from ${fullPath}`);
        throw new Error('Received HTML instead of encrypted data');
      }
      
      // Clean the data
      const cleanedData = text.trim().replace(/\s/g, '');
      
      return cleanedData;
    } catch (error) {
      console.error(`Error fetching encrypted data from ${path}:`, error);
      throw error; // Propagate the original error
    }
  }

  public getBasicQuestions(): Question[] {
    return this.basicQuestions;
  }

  public getPremiumQuestions(): Question[] {
    return this.premiumQuestions;
  }

  public isQuestionsLoaded(): boolean {
    return this.hasLoaded;
  }

  getAllQuestions(filters: QuestionFilters = {}): Question[] {
    if (!this.hasLoaded) {
      console.warn('QuestionBank not loaded. Call loadQuestions() first.');
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

  // Sample questions as a fallback
  private getSampleBasicQuestions(): Question[] {
    return [
      {
        id: 'sample1',
        question: 'What is SAP BTP?',
        options: [
          'SAP Business Technology Platform',
          'SAP Business Transaction Processing',
          'SAP Business Transformation Platform',
          'SAP Business Technical Platform'
        ],
        correctAnswer: 0,
        explanation: 'SAP BTP stands for SAP Business Technology Platform.',
        category: 'BTP Basics',
        difficulty: 1
      },
      {
        id: 'sample2',
        question: 'Which of the following is a core capability of SAP BTP?',
        options: [
          'Physical hardware management',
          'On-premise database administration',
          'Application development and integration',
          'Network infrastructure setup'
        ],
        correctAnswer: 2,
        explanation: 'Application development and integration is a core capability of SAP BTP.',
        category: 'BTP Capabilities',
        difficulty: 1
      },
      {
        id: 'sample3',
        question: 'What is the primary deployment model for SAP BTP?',
        options: [
          'On-premise only',
          'Cloud only',
          'Hybrid cloud',
          'Edge computing'
        ],
        correctAnswer: 2,
        explanation: 'SAP BTP supports a hybrid cloud deployment model.',
        category: 'BTP Deployment',
        difficulty: 1
      }
    ];
  }

  private getSamplePremiumQuestions(): Question[] {
    return [
      {
        id: 'premium1',
        question: 'Which of the following is a premium feature in SAP BTP?',
        options: [
          'Basic authentication',
          'Advanced analytics',
          'Simple storage',
          'Standard integration'
        ],
        correctAnswer: 1,
        explanation: 'Advanced analytics is a premium feature in SAP BTP.',
        category: 'Premium Features',
        difficulty: 2
      },
      {
        id: 'premium2',
        question: 'What is SAP HANA Cloud?',
        options: [
          'A physical server hosting solution',
          'An in-memory database as a service',
          'A network security service',
          'A user interface framework'
        ],
        correctAnswer: 1,
        explanation: 'SAP HANA Cloud is an in-memory database as a service.',
        category: 'SAP HANA',
        difficulty: 2
      },
      {
        id: 'premium3',
        question: 'Which of these is a key benefit of using SAP Integration Suite?',
        options: [
          'Hardware cost reduction',
          'End-to-end integration across applications',
          'Physical server management',
          'Network infrastructure setup'
        ],
        correctAnswer: 1,
        explanation: 'End-to-end integration across applications is a key benefit of SAP Integration Suite.',
        category: 'Integration',
        difficulty: 2
      }
    ];
  }
}

export const questionBank = QuestionBankService.getInstance();