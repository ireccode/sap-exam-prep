declare global {
  interface Window {
    env: {
      VITE_SUPABASE_URL: string;
      VITE_SUPABASE_ANON_KEY: string;
      VITE_STRIPE_PUBLISHABLE_KEY: string;
      VITE_STRIPE_PREMIUM_PRICE_ID: string;
      VITE_BASIC_ENCRYPTION_KEY: string;
      VITE_PREMIUM_ENCRYPTION_KEY: string;
      VITE_WEBHOOK_SECRET: string;
      VITE_OPENROUTER_API_KEY: string;
    };
  }
}

// Secret version and expiration tracking
interface SecretMetadata {
  version: string;
  expiresAt?: Date;
  rotationInProgress?: boolean;
}

const SECRET_METADATA = new Map<keyof Window['env'], SecretMetadata>();
const SECRET_ROTATION_WINDOW = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Define validation rules for environment variables
const ENV_VALIDATION_RULES = {
  VITE_SUPABASE_URL: (value: string) => {
    if (!value.startsWith('https://')) {
      throw new Error('VITE_SUPABASE_URL must start with https://');
    }
    return true;
  },
  VITE_SUPABASE_ANON_KEY: (value: string) => {
    if (!value.startsWith('eyJ')) {
      throw new Error('VITE_SUPABASE_ANON_KEY must be a valid JWT token');
    }
    return true;
  },
  VITE_STRIPE_PUBLISHABLE_KEY: (value: string) => {
    if (!value.startsWith('pk_')) {
      throw new Error('VITE_STRIPE_PUBLISHABLE_KEY must start with pk_');
    }
    return true;
  },
  VITE_STRIPE_PREMIUM_PRICE_ID: (value: string) => {
    if (!value.startsWith('price_')) {
      throw new Error('VITE_STRIPE_PREMIUM_PRICE_ID must start with price_');
    }
    return true;
  },
  VITE_BASIC_ENCRYPTION_KEY: (value: string) => {
    if (value.length < 32) {
      throw new Error('VITE_BASIC_ENCRYPTION_KEY must be at least 32 characters long');
    }
    return true;
  },
  VITE_PREMIUM_ENCRYPTION_KEY: (value: string) => {
    if (value.length < 32) {
      throw new Error('VITE_PREMIUM_ENCRYPTION_KEY must be at least 32 characters long');
    }
    return true;
  },
  VITE_WEBHOOK_SECRET: (value: string) => {
    if (!value.startsWith('whsec_')) {
      throw new Error('VITE_WEBHOOK_SECRET must start with whsec_');
    }
    return true;
  },
  VITE_OPENROUTER_API_KEY: (value: string) => {
    if (!value.startsWith('sk-or-')) {
      throw new Error('VITE_OPENROUTER_API_KEY must start with sk-or-');
    }
    return true;
  }
} as const;

// Track environment variable access
const envAccessLog = new Map<keyof Window['env'], { lastAccessed: Date; accessCount: number }>();

// Monitor environment variable access
function monitorEnvAccess(key: keyof Window['env']) {
  const now = new Date();
  const accessInfo = envAccessLog.get(key) || { lastAccessed: now, accessCount: 0 };
  envAccessLog.set(key, {
    lastAccessed: now,
    accessCount: accessInfo.accessCount + 1
  });

  // Log access patterns (in development or if monitoring is enabled)
  if (import.meta.env.DEV || import.meta.env.VITE_ENABLE_ENV_MONITORING) {
    console.debug(`Environment variable ${key} accessed:`, {
      lastAccessed: now,
      totalAccesses: accessInfo.accessCount + 1
    });
  }

  // Check for secret expiration
  checkSecretExpiration(key);
}

// Initialize secret metadata
function initializeSecretMetadata(key: keyof Window['env'], version: string, expiresInDays?: number) {
  const expiresAt = expiresInDays ? new Date(Date.now() + expiresInDays * 24 * 60 * 60 * 1000) : undefined;
  SECRET_METADATA.set(key, { version, expiresAt });
}

// Check if a secret is expired or nearing expiration
function checkSecretExpiration(key: keyof Window['env']) {
  const metadata = SECRET_METADATA.get(key);
  if (!metadata?.expiresAt) return;

  const now = new Date();
  const timeUntilExpiration = metadata.expiresAt.getTime() - now.getTime();

  // If secret is expired
  if (timeUntilExpiration <= 0) {
    console.error(`Secret ${key} has expired!`);
    throw new Error(`Secret ${key} has expired and needs to be rotated`);
  }

  // If secret is nearing expiration (within rotation window) and rotation isn't in progress
  if (timeUntilExpiration <= SECRET_ROTATION_WINDOW && !metadata.rotationInProgress) {
    console.warn(`Secret ${key} is nearing expiration. Please rotate within ${Math.ceil(timeUntilExpiration / (1000 * 60 * 60))} hours`);
    // Trigger rotation process if auto-rotation is enabled
    if (import.meta.env.VITE_ENABLE_AUTO_ROTATION) {
      initiateSecretRotation(key);
    }
  }
}

// Initiate secret rotation process
async function initiateSecretRotation(key: keyof Window['env']) {
  const metadata = SECRET_METADATA.get(key);
  if (!metadata || metadata.rotationInProgress) return;

  try {
    metadata.rotationInProgress = true;
    SECRET_METADATA.set(key, metadata);

    // Log rotation initiation
    console.info(`Initiating rotation for secret ${key}`);

    // Here you would implement your secret rotation logic
    // For example, calling an API to generate new credentials
    // await rotateSecret(key);

    // Update metadata with new version and expiration
    const newVersion = `${parseInt(metadata.version) + 1}`;
    initializeSecretMetadata(key, newVersion, 90); // 90 days expiration

    console.info(`Successfully rotated secret ${key} to version ${newVersion}`);
  } catch (error) {
    console.error(`Failed to rotate secret ${key}:`, error);
    throw error;
  } finally {
    const updatedMetadata = SECRET_METADATA.get(key);
    if (updatedMetadata) {
      updatedMetadata.rotationInProgress = false;
      SECRET_METADATA.set(key, updatedMetadata);
    }
  }
}

// Get secret metadata
export function getSecretMetadata(key: keyof Window['env']) {
  return SECRET_METADATA.get(key);
}

// Validate environment variable
function validateEnvVar(key: keyof Window['env'], value: string): boolean {
  const validator = ENV_VALIDATION_RULES[key];
  if (validator) {
    try {
      return validator(value);
    } catch (error) {
      console.error(`Environment variable validation failed for ${key}:`, error);
      throw error;
    }
  }
  return true;
}

// Get environment variable with validation and monitoring
export function getEnvVar(key: keyof Window['env']): string {
  let value: string;

  // Get value based on environment
  if (import.meta.env.DEV) {
    value = import.meta.env[key];
  } else {
    if (!window.env || !window.env[key]) {
      throw new Error(`Environment variable ${key} is not defined`);
    }
    value = window.env[key];
  }

  // Validate value
  validateEnvVar(key, value);

  // Monitor access and check expiration
  monitorEnvAccess(key);

  return value;
}

// Get environment variable access statistics
export function getEnvAccessStats() {
  return Object.fromEntries(envAccessLog.entries());
}

// Check if all required environment variables are present
export function validateAllEnvVars(): boolean {
  const requiredVars = Object.keys(ENV_VALIDATION_RULES) as Array<keyof Window['env']>;
  
  for (const key of requiredVars) {
    try {
      const value = getEnvVar(key);
      validateEnvVar(key, value);
    } catch (error) {
      console.error(`Environment validation failed:`, error);
      return false;
    }
  }
  
  return true;
}

// Initialize secret metadata for all environment variables
export function initializeAllSecrets() {
  const requiredVars = Object.keys(ENV_VALIDATION_RULES) as Array<keyof Window['env']>;
  
  for (const key of requiredVars) {
    // Initialize with version 1 and 90-day expiration
    initializeSecretMetadata(key, '1', 90);
  }
} 