import type { LoggingLevel } from '@/infrastructure/types/logging';

// infrastructure/logging/LogOutput.ts
export interface LogOutput {
  write(level: LoggingLevel, message: string): void;
}
