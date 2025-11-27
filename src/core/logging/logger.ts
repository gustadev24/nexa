import type { Loggeable } from '@/core/logging/loggeable';

export interface Logger {
  info(context: Loggeable, message: string, ...args: unknown[]): void;
  warn(context: Loggeable, message: string, ...args: unknown[]): void;
  error(context: Loggeable, message: string, ...args: unknown[]): void;
}
