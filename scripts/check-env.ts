// Author: Bin Lee
// Email: binlee120@gmail.com
import { useLogger } from '@/hooks/useLogger';
import { getEnvironmentInfo } from './env-validation';

const logger = useLogger('check-env');
try {
  const envInfo = getEnvironmentInfo();
  logger.info(`Environment, {envInfo}`);
  logger.info(`Timestamp, {envInfo.timestamp}`);
  if (envInfo.validation.isValid) {
    logger.info('All required environment variables are set.');
    if (envInfo.validation.missingOptional.length > 0) {
      logger.warn(
        'However, some optional environment variables are missing:',
        envInfo.validation.missingOptional
      );
    }
  } else {
    logger.error(
      'Some required environment variables are missing:',
      envInfo.validation.missingRequired
    );
  }
} catch (error) {
  logger.error('Environment validation error:', { error });
  process.exit(1);
}
