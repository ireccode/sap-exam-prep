import { vi } from 'vitest';
import { questionBank } from '../../services/questionBank';
import { EncryptionService } from '@/services/encryptionService';
import { useProgressStore } from '@/store/useProgressStore';
import { Question } from '../../types/question';

// Mock EncryptionService
vi.mock('@/services/encryptionService', () => ({
  EncryptionService: {
    getInstance: vi.fn().mockReturnValue({
      decryptQuestions: vi.fn()
    })
  }
}));

// Mock useProgressStore
vi.mock('@/store/useProgressStore', () => ({
  useProgressStore: {
    getState: vi.fn().mockReturnValue({
      getWeakAreas: vi.fn().mockReturnValue(['BTP']),
      updateProgress: vi.fn()
    })
  }
}));

// Mock fetch for loading question banks
global.fetch = vi.fn();

describe('QuestionBank Service', () => {
  const mockBasicQuestions: Question[] = [
    {
      id: '1',
      category: 'BTP',
      question: 'Basic Q1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 0,
      explanation: 'Basic explanation 1',
      difficulty: 1,
      isPremium: false
    },
    {
      id: '2',
      category: 'Security',
      question: 'Basic Q2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 1,
      explanation: 'Basic explanation 2',
      difficulty: 1,
      isPremium: false
    }
  ];

  const mockPremiumQuestions: Question[] = [
    {
      id: '3',
      category: 'BTP',
      question: 'Premium Q1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 2,
      explanation: 'Premium explanation 1',
      difficulty: 2,
      isPremium: true
    },
    {
      id: '4',
      category: 'Security',
      question: 'Premium Q2',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 3,
      explanation: 'Premium explanation 2',
      difficulty: 2,
      isPremium: true
    }
  ];

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock basic questions
    vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
      const url = input.toString();
      if (url.includes('basic_btp_query_bank.json')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ questions: mockBasicQuestions })
        } as Response);
      }
      if (url.includes('premium_btp_query_bank.encrypted')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve('encrypted_data')
        } as Response);
      }
      return Promise.reject(new Error('Not found'));
    });

    // Mock successful decryption
    vi.mocked(EncryptionService.getInstance().decryptQuestions).mockResolvedValue(mockPremiumQuestions);
  });

  describe('Premium Content Decryption', () => {
    it('handles decryption failures gracefully', async () => {
      // Mock decryption failure
      vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.includes('basic_btp_query_bank.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ questions: mockBasicQuestions })
          } as Response);
        }
        if (url.includes('premium_btp_query_bank.encrypted')) {
          return Promise.resolve({
            ok: true,
            text: () => Promise.resolve('encrypted_data')
          } as Response);
        }
        return Promise.reject(new Error('Failed to load premium content'));
      });

      // Mock decryption failure
      vi.mocked(EncryptionService.getInstance().decryptQuestions).mockRejectedValue(new Error('Decryption failed'));

      await questionBank.initialize();
      const allQuestions = questionBank.getAllQuestions({ isPremium: true });
      
      // Should still return basic questions even if premium decryption fails
      expect(allQuestions).toHaveLength(2);
      expect(allQuestions.every((q: Question) => !q.isPremium)).toBe(true);
    });

    it('handles network errors when loading encrypted content', async () => {
      // Mock network error for premium content
      vi.mocked(fetch).mockImplementation((input: RequestInfo | URL) => {
        const url = input.toString();
        if (url.includes('basic_btp_query_bank.json')) {
          return Promise.resolve({
            ok: true,
            json: () => Promise.resolve({ questions: mockBasicQuestions })
          } as Response);
        }
        if (url.includes('premium_btp_query_bank.encrypted')) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.reject(new Error('Not found'));
      });

      await questionBank.initialize();
      const allQuestions = questionBank.getAllQuestions({ isPremium: true });
      
      expect(allQuestions).toHaveLength(2);
      expect(allQuestions.every((q: Question) => !q.isPremium)).toBe(true);
    });
  });

  describe('Access Control', () => {
    beforeEach(async () => {
      await questionBank.initialize();
    });

    test('filters questions based on premium access', async () => {
      const basicQuestions = questionBank.getAllQuestions({ isPremium: false });
      const allQuestions = questionBank.getAllQuestions({ isPremium: true });
      
      expect(basicQuestions).toHaveLength(2);
      expect(allQuestions).toHaveLength(4);
      expect(basicQuestions.every(q => !q.isPremium)).toBe(true);
    });

    test('filters questions by category and premium status', async () => {
      const btpBasicQuestions = questionBank.getQuestionsByCategory('BTP', { isPremium: false });
      const btpAllQuestions = questionBank.getQuestionsByCategory('BTP', { isPremium: true });
      
      expect(btpBasicQuestions).toHaveLength(1);
      expect(btpAllQuestions).toHaveLength(2);
    });

    test('filters questions by difficulty', async () => {
      const easyQuestions = questionBank.getAllQuestions({ isPremium: true, difficulty: 1 });
      const hardQuestions = questionBank.getAllQuestions({ isPremium: true, difficulty: 2 });
      
      expect(easyQuestions).toHaveLength(2);
      expect(hardQuestions).toHaveLength(2);
      expect(easyQuestions.every(q => q.difficulty === 1)).toBe(true);
      expect(hardQuestions.every(q => q.difficulty === 2)).toBe(true);
    });
  });

  describe('Category Management', () => {
    test('returns correct categories based on premium access', async () => {
      await questionBank.initialize();
      
      const categories = questionBank.getCategories({ isPremium: true });
      expect(categories).toContain('BTP');
      expect(categories).toContain('Security');
      expect(categories).toHaveLength(2);
    });

    test('returns correct question count for categories', async () => {
      await questionBank.initialize();
      
      const btpBasicCount = questionBank.getCategoryCount('BTP', { isPremium: false });
      const btpTotalCount = questionBank.getCategoryCount('BTP', { isPremium: true });
      
      expect(btpBasicCount).toBe(1);
      expect(btpTotalCount).toBe(2);
    });

    test('returns empty array for non-existent category', async () => {
      await questionBank.initialize();
      
      const questions = questionBank.getQuestionsByCategory('NonExistent', { isPremium: true });
      expect(questions).toHaveLength(0);
    });
  });

  describe('Adaptive Questions', () => {
    test('prioritizes questions from weak areas', async () => {
      await questionBank.initialize();
      
      const adaptiveQuestions = questionBank.getAdaptiveQuestions(2, { isPremium: true });
      const btpQuestions = adaptiveQuestions.filter(q => q.category === 'BTP');
      
      expect(btpQuestions.length).toBeGreaterThan(0);
    });

    test('includes questions from other categories when not enough weak area questions', async () => {
      await questionBank.initialize();
      
      const adaptiveQuestions = questionBank.getAdaptiveQuestions(4, { isPremium: true });
      const btpQuestions = adaptiveQuestions.filter(q => q.category === 'BTP');
      const securityQuestions = adaptiveQuestions.filter(q => q.category === 'Security');
      
      expect(btpQuestions.length).toBeGreaterThan(0);
      expect(securityQuestions.length).toBeGreaterThan(0);
      expect(adaptiveQuestions).toHaveLength(4);
    });

    test('respects premium status when getting adaptive questions', async () => {
      await questionBank.initialize();
      
      const basicAdaptiveQuestions = questionBank.getAdaptiveQuestions(2, { isPremium: false });
      const premiumAdaptiveQuestions = questionBank.getAdaptiveQuestions(2, { isPremium: true });
      
      expect(basicAdaptiveQuestions.every(q => !q.isPremium)).toBe(true);
      expect(premiumAdaptiveQuestions.some(q => q.isPremium)).toBe(true);
    });
  });
}); 