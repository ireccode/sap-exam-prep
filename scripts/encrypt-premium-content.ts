import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';
import crypto from 'crypto';

// Load environment variables
dotenv.config();

// Make sure we have the encryption key
const ENCRYPTION_KEY = process.env.PREMIUM_ENCRYPTION_KEY;
if (!ENCRYPTION_KEY) {
  console.error('PREMIUM_ENCRYPTION_KEY not found in environment variables');
  process.exit(1);
}

// At this point, ENCRYPTION_KEY is definitely a string
const encryptionKey: string = ENCRYPTION_KEY;

async function encryptPremiumContent() {
  try {
    // Read the premium questions file
    const premiumQuestionsPath = path.join(process.cwd(), 'public', 'premium_btp_query_bank.json');
    const premiumQuestionsRaw = fs.readFileSync(premiumQuestionsPath, 'utf-8');
    const premiumQuestions = JSON.parse(premiumQuestionsRaw).questions;

    // Generate a random salt and IV
    const salt = crypto.randomBytes(16);
    const iv = crypto.randomBytes(12);

    // Derive key using PBKDF2
    const key = crypto.pbkdf2Sync(
      encryptionKey,
      salt,
      100000,
      32,
      'sha256'
    );

    // Create cipher
    const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);

    // Encrypt the data
    const data = Buffer.from(JSON.stringify(premiumQuestions));
    const encryptedContent = Buffer.concat([
      cipher.update(data),
      cipher.final()
    ]);

    // Get the auth tag
    const authTag = cipher.getAuthTag();

    // Combine salt, iv, auth tag, and encrypted content
    const combinedData = Buffer.concat([
      salt,
      iv,
      encryptedContent,
      authTag
    ]);

    // Convert to base64
    const base64Data = combinedData.toString('base64');

    // Write the encrypted content to a new file
    const encryptedFilePath = path.join(process.cwd(), 'public', 'premium_btp_query_bank.encrypted');
    fs.writeFileSync(encryptedFilePath, base64Data);

    console.log('Successfully encrypted premium content');
    console.log('Original file size:', fs.statSync(premiumQuestionsPath).size, 'bytes');
    console.log('Encrypted file size:', fs.statSync(encryptedFilePath).size, 'bytes');
  } catch (error) {
    console.error('Error encrypting premium content:', error);
    process.exit(1);
  }
}

encryptPremiumContent(); 