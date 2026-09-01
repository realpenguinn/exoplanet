export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface LogEvent {
  level: LogLevel;
  scope: string;
  message: string;
  timestamp: string;
  context?: Record<string, unknown>;
}

class CosmoScanLogger {
  private buffer: LogEvent[] = [];
  private readonly maxBuffer = 200;

  private write(level: LogLevel, scope: string, message: string, context?: Record<string, unknown>): void {
    const event: LogEvent = { level, scope, message, timestamp: new Date().toISOString(), context };
    this.buffer.push(event);
    if (this.buffer.length > this.maxBuffer) this.buffer.shift();

    const consoleFn = level === 'error' ? console.error : level === 'warn' ? console.warn : console.log;
    consoleFn(`[CosmoScan:${scope}]`, message, context ?? '');
  }

  public debug(scope: string, message: string, context?: Record<string, unknown>) { this.write('debug', scope, message, context); }
  public info(scope: string, message: string, context?: Record<string, unknown>) { this.write('info', scope, message, context); }
  public warn(scope: string, message: string, context?: Record<string, unknown>) { this.write('warn', scope, message, context); }
  public error(scope: string, message: string, context?: Record<string, unknown>) { this.write('error', scope, message, context); }

  public dumpBuffer(): LogEvent[] {
    return [...this.buffer];
  }
}

export const logger = new CosmoScanLogger();
