import type { Logger } from '@/core/interfaces/logger';

export class ComposeLogger implements Logger {
  private _loggers: Logger[];

  constructor(loggers?: Logger[]) {
    this._loggers = loggers || [];
  }

  private log(method: keyof Logger, message: string, ...args: unknown[]): void {
    for (const logger of this._loggers) {
      logger[method](message, ...args);
    }
  }

  info(message: string, ...args: unknown[]): void {
    this.log('info', message, ...args);
  }

  warn(message: string, ...args: unknown[]): void {
    this.log('warn', message, ...args);
  }

  error(message: string, ...args: unknown[]): void {
    this.log('error', message, ...args);
  }
}
