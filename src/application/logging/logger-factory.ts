import type { Logger } from '@/core/logging/logger';
import { ComposeLogger } from '@/application/logging/compose-logger';
import { ConsoleLogger } from '@/application/logging/console-logger';
import { ViteLogger } from '@/application/logging/vite-logger';

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
