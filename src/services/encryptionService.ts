import { Question } from '@/types/question';

export class EncryptionService {
  private static instance: EncryptionService;
  private premiumEncryptionKey: string;
  private basicEncryptionKey: string;
  private encoder: TextEncoder;
  private decoder: TextDecoder;

  private constructor() {
    const premiumKey = import.meta.env.VITE_PREMIUM_ENCRYPTION_KEY;
    const basicKey = import.meta.env.VITE_BASIC_ENCRYPTION_KEY;

    if (!premiumKey || !basicKey) {
      throw new Error('Missing encryption keys in environment variables');
    }

    this.premiumEncryptionKey = premiumKey;
    this.basicEncryptionKey = basicKey;
    this.encoder = new TextEncoder();
    this.decoder = new TextDecoder();
  }

  public static getInstance(): EncryptionService {
    if (!EncryptionService.instance) {
      EncryptionService.instance = new EncryptionService();
    }
    return EncryptionService.instance;
  }

  private async deriveKey(salt: Uint8Array, isBasic: boolean = false): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      this.encoder.encode(isBasic ? this.basicEncryptionKey : this.premiumEncryptionKey),
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

  public async encryptQuestions(questions: Question[], isBasic: boolean = false): Promise<string> {
    try {
      const salt = crypto.getRandomValues(new Uint8Array(16));
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const key = await this.deriveKey(salt, isBasic);

      const data = this.encoder.encode(JSON.stringify(questions));
      const encrypted = await crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        data
      );

      const encryptedArray = new Uint8Array(encrypted);
      const result = this.concatUint8Arrays(
        this.concatUint8Arrays(salt, iv),
        encryptedArray
      );

      return btoa(String.fromCharCode(...result));
    } catch (error) {
      console.error('Error encrypting questions:', error);
      throw new Error('Failed to encrypt questions');
    }
  }

  public async decryptQuestions(encryptedData: string, isBasic: boolean = false): Promise<Question[]> {
    try {
      const data = new Uint8Array(
        atob(encryptedData)
          .split('')
          .map(char => char.charCodeAt(0))
      );

      const salt = data.slice(0, 16);
      const iv = data.slice(16, 28);
      const encrypted = data.slice(28);

      const key = await this.deriveKey(salt, isBasic);

      const decrypted = await crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv
        },
        key,
        encrypted
      );

      const decoded = this.decoder.decode(decrypted);
      return JSON.parse(decoded);
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