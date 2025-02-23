import { Question } from '@/types/question';

export class EncryptionService {
  private static instance: EncryptionService;
  private encryptionKey: string;
  private encoder: TextEncoder;
  private decoder: TextDecoder;

  private constructor() {
    // Get encryption key from either Vite's import.meta.env or Node's process.env
    this.encryptionKey = typeof process !== 'undefined' ? 
      process.env.VITE_PREMIUM_ENCRYPTION_KEY! :
      import.meta.env.VITE_PREMIUM_ENCRYPTION_KEY;

    if (!this.encryptionKey) {
      throw new Error('Encryption key not found in environment variables');
    }
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private async deriveKey(salt: Uint8Array): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(this.encryptionKey),
      { name: 'PBKDF2' },
      false,
      ['deriveBits', 'deriveKey']
    );

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt,
        iterations: 100000,
        hash: 'SHA-256'
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt']
    );
  }

  public async encryptQuestions(questions: Question[]): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(salt);

      const data = this.encoder.encode(JSON.stringify(questions));
      const encryptedContent = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      // Combine salt, iv, and encrypted content
      const combinedData = new Uint8Array(salt.length + iv.length + encryptedContent.byteLength);
      combinedData.set(salt, 0);
      combinedData.set(iv, salt.length);
      combinedData.set(new Uint8Array(encryptedContent), salt.length + iv.length);

      // Convert to base64 for storage
      return btoa(String.fromCharCode(...combinedData));
    } catch (error) {
      console.error('Error encrypting questions:', error);
      throw new Error('Failed to encrypt questions');
    }
  }

  public async decryptQuestions(encryptedData: string): Promise<Question[]> {
    try {
      // Convert from base64
      const data = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

      // Extract components
      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encryptedContent = data.slice(28);

      // Derive the key
      const key = await this.deriveKey(salt);

      // Decrypt the content
      const decryptedContent = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
          tagLength: 128 // 16 bytes * 8 = 128 bits
        },
        key,
        encryptedContent
      );

      const decryptedText = this.decoder.decode(decryptedContent);
      return JSON.parse(decryptedText);
    } catch (error) {
      console.error('Error decrypting questions:', error);
      throw new Error('Failed to decrypt questions');
    }
  }

  private concatUint8Arrays(a: Uint8Array, b: Uint8Array): Uint8Array {
    const result = new Uint8Array(a.length + b.length);
    result.set(a);
    result.set(b, a.length);
    return result;
  }
} 