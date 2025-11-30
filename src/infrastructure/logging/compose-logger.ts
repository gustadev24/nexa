import type { Loggeable } from '@/application/interfaces/logging/loggeable';
import type { Logger } from '@/application/interfaces/logging/logger';

export class ComposeLogger implements Logger {
  private _loggers: Logger[];

  constructor(loggers?: Logger[]) {
    this._loggers = loggers || [];
  }

  private log(method: keyof Logger, context: Loggeable, message: string, ...args: unknown[]): void {
    for (const logger of this._loggers) {
      logger[method](context, message, ...args);
    }
  }

  info(context: Loggeable, message: string, ...args: unknown[]): void {
    this.log('info', context, message, ...args);
  }

  warn(context: Loggeable, message: string, ...args: unknown[]): void {
    this.log('warn', context, message, ...args);
  }

  error(context: Loggeable, message: string, ...args: unknown[]): void {
    this.log('error', context, message, ...args);
  }
}
