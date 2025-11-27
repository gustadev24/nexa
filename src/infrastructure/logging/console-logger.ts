import type { Logger } from '@/core/logging/logger';

export class ConsoleLogger implements Logger {
  info(context: string, message: string, ...args: unknown[]): void {
    console.info(`[INFO] [${context}] ${message}`, ...args);
  }

  warn(context: string, message: string, ...args: unknown[]): void {
    console.warn(`[WARN] [${context}] ${message}`, ...args);
  }

  error(context: string, message: string, ...args: unknown[]): void {
    console.error(`[ERROR] [${context}] ${message}`, ...args);
  }
}
