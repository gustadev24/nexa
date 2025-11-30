import type { Loggeable } from '@/application/interfaces/logging/loggeable';
import type { Logger } from '@/application/interfaces/logging/logger';
import terminal from 'virtual:terminal';

export class ViteLogger implements Logger {
  info(context: Loggeable, message: string, ...args: unknown[]): void {
    terminal.log(`[INFO] [${context._logContext}] ${message}`, ...args);
  }

  warn(context: Loggeable, message: string, ...args: unknown[]): void {
    terminal.warn(`[WARN] [${context._logContext}] ${message}`, ...args);
  }

  error(context: Loggeable, message: string, ...args: unknown[]): void {
    terminal.error(`[ERROR] [${context._logContext}] ${message}`, ...args);
  }
}
