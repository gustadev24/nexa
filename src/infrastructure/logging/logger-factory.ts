import type { Logger } from '@/application/interfaces/logging/logger';
import { ComposeLogger } from '@/infrastructure/logging/compose-logger';
import { ConsoleLogger } from '@/infrastructure/logging/console-logger';
import { ViteLogger } from '@/infrastructure/logging/vite-logger';

class LoggerFactory {
  create(): Logger {
    const loggers = [];

    if (import.meta.env.DEV) {
      loggers.push(new ConsoleLogger(), new ViteLogger());
    }
    else if (import.meta.env.PROD) {
      loggers.push(new ViteLogger());
    }

    return new ComposeLogger(loggers);
  }
}

const loggerFactory = new LoggerFactory();

export { loggerFactory as LoggerFactory };
