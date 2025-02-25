import { Question } from '@/types/question';
import { EncryptionService } from './encryptionService';

export class QuestionBankService {
  private static instance: QuestionBankService;
  private basicQuestions: Question[] | null = null;
  private premiumQuestions: Question[] | null = null;
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

  public async loadQuestions(isPremium: boolean = false): Promise<Question[]> {
    try {
      // Load basic questions if not already loaded
      if (!this.basicQuestions) {
        const basicResponse = await fetch('/btp_query_bank.encrypted');
        const encryptedBasicData = await basicResponse.text();
        this.basicQuestions = await this.encryptionService.decryptQuestions(encryptedBasicData, true);
        console.log('Basic questions loaded successfully');
      }

      // Load premium questions if user is premium and not already loaded
      if (isPremium && !this.premiumQuestions) {
        const premiumResponse = await fetch('/premium_btp_query_bank.encrypted');
        const encryptedPremiumData = await premiumResponse.text();
        this.premiumQuestions = await this.encryptionService.decryptQuestions(encryptedPremiumData);
        console.log('Premium questions loaded successfully');
      }

      // Combine questions based on user's premium status
      const allQuestions = [...this.basicQuestions];
      if (isPremium && this.premiumQuestions) {
        allQuestions.push(...this.premiumQuestions);
      }

      return allQuestions;
    } catch (error) {
      console.error('Error loading questions:', error);
      throw new Error('Failed to load questions');
    }
  }

  public clearCache(): void {
    this.basicQuestions = null;
    this.premiumQuestions = null;
  }
} 