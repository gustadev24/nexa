import type { Logger } from '@/core/logging/logger';
import terminal from 'virtual:terminal';

export class ViteLogger implements Logger {
  info(context: string, message: string, ...args: unknown[]): void {
    terminal.log(`[INFO] [${context}] ${message}`, ...args);
  }

  warn(context: string, message: string, ...args: unknown[]): void {
    terminal.warn(`[WARN] [${context}] ${message}`, ...args);
  }

  error(context: string, message: string, ...args: unknown[]): void {
    terminal.error(`[ERROR] [${context}] ${message}`, ...args);
  }
}
