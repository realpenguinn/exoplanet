import './style.css';
import { CosmoScanApp } from './ui/controllers/AppController';
import { ErrorBoundary } from './observability/ErrorBoundary';
import { logger } from './observability/logger';

// Initialize global runtime error boundary
ErrorBoundary.init();

// Boot application
try {
  logger.info('Bootstrap', 'Initializing CosmoScan Astronomical Suite...');
  new CosmoScanApp();
} catch (err) {
  ErrorBoundary.handleFatalError(err);
}
