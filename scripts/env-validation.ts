import { useLogger } from '@/hooks/useLogger';

const logger = useLogger('env-validation');

// Define all required environment variables
const REQUIRED_ENV_VARS = {
  // Supabase
  NEXT_PUBLIC_SUPABASE_URL: 'Supabase project URL',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'Supabase anonymous key',

  // TipTap (optional for some features)
  TIPTAP_CONVERSION_APP_ID: 'TipTap conversion app ID (optional)',
  TIPTAP_CONVERSION_SECRET: 'TipTap conversion secret (optional)',
  CLOUDCONVERT_API_KEY: 'CloudConvert API key (optional)',
  TIPTAP_DOCUMENT_SERVER_SECRET_KEY: 'TipTap document server secret (optional)',

  // OpenAI (optional)
  OPENAI_API_KEY: 'OpenAI API key (optional)',
} as const;

const OPTIONAL_ENV_VARS = [
  'TIPTAP_CONVERSION_APP_ID',
  'TIPTAP_CONVERSION_SECRET',
  'CLOUDCONVERT_API_KEY',
  'TIPTAP_DOCUMENT_SERVER_SECRET_KEY',
  'OPENAI_API_KEY',
];

export interface EnvValidationResult {
  isValid: boolean;
  missingRequired: string[];
  missingOptional: string[];
  errors: string[];
}

/**
 * Validates all environment variables
 */
export function validateEnvironment(): EnvValidationResult {
  const missingRequired: string[] = [];
  const missingOptional: string[] = [];
  const errors: string[] = [];

  // Check each required environment variable
  for (const [envVar, description] of Object.entries(REQUIRED_ENV_VARS)) {
    const value = process.env[envVar];

    if (!value || value.trim() === '') {
      if (OPTIONAL_ENV_VARS.includes(envVar)) {
        missingOptional.push(`${envVar}: ${description}`);
      } else {
        missingRequired.push(`${envVar}: ${description}`);
        errors.push(`Missing required environment variable: ${envVar}`);
      }
    } else {
      // Validate format for specific variables
      if (envVar === 'NEXT_PUBLIC_SUPABASE_URL') {
        try {
          new URL(value);
        } catch {
          errors.push(
            `Invalid NEXT_PUBLIC_SUPABASE_URL format: must be a valid URL`
          );
        }
      }

      if (envVar === 'NEXT_PUBLIC_SUPABASE_ANON_KEY') {
        if (value.length < 100) {
          errors.push(
            `Invalid NEXT_PUBLIC_SUPABASE_ANON_KEY: appears to be too short`
          );
        }
      }
    }
  }

  const isValid = missingRequired.length === 0 && errors.length === 0;

  // Log results
  if (!isValid) {
    logger.error('Environment validation failed:', {
      missingRequired,
      errors,
    });
  } else {
    logger.info('Environment validation passed');
    if (missingOptional.length > 0) {
      logger.warn('Optional environment variables missing:', missingOptional);
    }
  }

  return {
    isValid,
    missingRequired,
    missingOptional,
    errors,
  };
}

/**
 * Validates environment and throws error if critical variables are missing
 */
export function validateEnvironmentOrThrow(): void {
  const result = validateEnvironment();

  if (!result.isValid) {
    const errorMessage = [
      'Environment validation failed!',
      '',
      'Missing required environment variables:',
      ...result.missingRequired.map((item) => `  - ${item}`),
      '',
      'Errors:',
      ...result.errors.map((error) => `  - ${error}`),
      '',
      'Please check your .env.local file and ensure all required variables are set.',
    ].join('\n');

    throw new Error(errorMessage);
  }
}

/**
 * Get environment info for debugging
 */
export function getEnvironmentInfo() {
  const nodeEnv = process.env.NODE_ENV || 'development';
  const result = validateEnvironment();

  return {
    nodeEnv,
    validation: result,
    timestamp: new Date().toISOString(),
  };
}
