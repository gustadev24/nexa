import type { Logger } from '@/core/interfaces/logger';

export class ConsoleLogger implements Logger {
  info(message: string, ...args: unknown[]): void {
    console.info(`[INFO]: ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    console.warn(`[WARN]: ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    console.error(`[ERROR]: ${message}`, ...args);
  }
}
