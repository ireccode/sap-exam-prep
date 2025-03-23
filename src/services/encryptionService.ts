import { Question } from '@/types/question';
import { supabase } from '@/lib/supabase';

export class EncryptionService {
  private static instance: EncryptionService;

  private constructor() {
    // No longer need to access encryption keys directly
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  public async encryptQuestions(questions: Question[], isBasic: boolean = false): Promise<string> {
    // Keep the encryptQuestions method for build-time encryption if needed
    // But it should only be used during build, not in the browser
    throw new Error('Method not implemented');
  }

  public async decryptQuestions(encryptedData: string, isPremium: boolean = false): Promise<Question[]> {
    try {
      // Log the first few characters of the encrypted data for debugging
      console.log(`Decrypting ${isPremium ? 'premium' : 'basic'} data, first 20 chars:`, 
        encryptedData.substring(0, 20));
      
      const { data, error } = await supabase.functions.invoke('decrypt-content', {
        body: { 
          encryptedData, 
          isPremium 
        }
      });

      if (error) {
        console.error('Error from decrypt-content function:', error);
        throw new Error(`Error calling decrypt function: ${error.message}`);
      }

      if (!data || !data.data) {
        console.error('Invalid response from decrypt function:', data);
        throw new Error('Invalid response from decrypt function');
      }

      return data.data as Question[];
    } catch (error) {
      console.error('Error decrypting questions:', error);
      throw new Error('Failed to decrypt questions');
    }
  }
} 