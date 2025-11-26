import type { Logger } from '@/core/interfaces/logger';
import { ComposeLogger } from '@/infrastructure/logging/compose-logger';
import { ConsoleLogger } from '@/infrastructure/logging/console-logger';
import { ViteLogger } from '@/infrastructure/logging/vite-logger';

export class LoggerFactory {
  static create(): Logger {
    const loggers = [];
    const env = process.env.NODE_ENV || 'development';

    if (env === 'development') {
      loggers.push(new ConsoleLogger(), new ViteLogger());
    }
    else if (env === 'production') {
      loggers.push(new ConsoleLogger());
    }

    return new ComposeLogger(loggers);
  }
}
