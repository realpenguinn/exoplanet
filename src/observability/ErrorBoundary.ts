import { logger } from './logger';

export class ErrorBoundary {
  public static init(): void {
    window.addEventListener('error', (event) => {
      logger.error('Runtime', `Uncaught exception: ${event.message}`, {
        filename: event.filename,
        lineno: event.lineno,
        colno: event.colno,
        stack: event.error?.stack
      });
      this.handleFatalError(event.error || event.message);
    });

    window.addEventListener('unhandledrejection', (event) => {
      logger.error('Promise', `Unhandled rejection: ${event.reason}`, {
        reason: event.reason
      });
    });
  }

  public static handleFatalError(error: unknown): void {
    console.error('[CosmoScan Fatal Error Boundary]', error);
    const canvas = document.getElementById('canvas3d');
    const fallback = document.getElementById('fallbackScreen');
    if (canvas && fallback) {
      canvas.style.display = 'none';
      fallback.style.display = 'flex';
      const msgEl = document.getElementById('fallbackErrorMsg');
      if (msgEl) {
        msgEl.textContent = error instanceof Error ? error.message : String(error);
      }
    }
  }
}
