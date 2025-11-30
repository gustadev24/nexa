import type { Loggeable } from '@/core/logging/loggeable';
import type { Logger } from '@/core/logging/logger';

export class ConsoleLogger implements Logger {
  info(context: Loggeable, message: string, ...args: unknown[]): void {
    console.info(`[INFO] [${context._logContext}] ${message}`, ...args);
  }

  warn(context: Loggeable, message: string, ...args: unknown[]): void {
    console.warn(`[WARN] [${context._logContext}] ${message}`, ...args);
  }

  error(context: Loggeable, message: string, ...args: unknown[]): void {
    console.error(`[ERROR] [${context._logContext}] ${message}`, ...args);
  }
}
