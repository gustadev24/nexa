export interface Logger {
  info(context: string, message: string, ...args: unknown[]): void;
  warn(context: string, message: string, ...args: unknown[]): void;
  error(context: string, message: string, ...args: unknown[]): void;
}
