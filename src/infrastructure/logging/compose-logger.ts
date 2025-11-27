import type { Logger } from '@/core/logging/logger';

export class ComposeLogger implements Logger {
  private _loggers: Logger[];

  constructor(loggers?: Logger[]) {
    this._loggers = loggers || [];
  }

  private log(method: keyof Logger, context: string, message: string, ...args: unknown[]): void {
    for (const logger of this._loggers) {
      logger[method](context, message, ...args);
    }
  }

  info(context: string, message: string, ...args: unknown[]): void {
    this.log('info', context, message, ...args);
  }

  warn(context: string, message: string, ...args: unknown[]): void {
    this.log('warn', context, message, ...args);
  }

  error(context: string, message: string, ...args: unknown[]): void {
    this.log('error', context, message, ...args);
  }
}
