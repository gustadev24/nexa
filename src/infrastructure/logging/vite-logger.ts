import type { Logger } from '@/core/interfaces/logger';
import terminal from 'virtual:terminal';

export class ViteLogger implements Logger {
  info(message: string, ...args: unknown[]): void {
    terminal.info(`[INFO]: ${message}`, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    terminal.warn(`[WARN]: ${message}`, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    terminal.error(`[ERROR]: ${message}`, ...args);
  }
}
