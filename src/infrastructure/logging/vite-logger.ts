import type { Loggeable } from '@/application/interfaces/logging/loggeable';
import type { Logger } from '@/application/interfaces/logging/logger';
import terminal from 'virtual:terminal';

export class ViteLogger implements Logger {
  /**
   * Serializa argumentos de forma segura, evitando referencias circulares
   */
  private safeSerialize(args: unknown[]): unknown[] {
    return args.map((arg) => {
      if (typeof arg === 'object' && arg !== null) {
        try {
          // Crear un Set para rastrear objetos ya vistos
          const seen = new WeakSet();

          // Replacer que evita ciclos
          const replacer = (_key: string, value: unknown) => {
            if (typeof value === 'object' && value !== null) {
              if (seen.has(value)) {
                return '[Circular Reference]';
              }
              seen.add(value);
            }
            return value;
          };

          // Intentar serializar y deserializar para obtener una copia segura
          return JSON.parse(JSON.stringify(arg, replacer));
        }
        catch {
          // Si falla, retornar una representación simple
          return `[${arg.constructor?.name || 'Object'}]`;
        }
      }
      return arg;
    });
  }

  info(context: Loggeable, message: string, ...args: unknown[]): void {
    const safeArgs = this.safeSerialize(args);
    terminal.log(`[INFO] [${context._logContext}] ${message}`, ...safeArgs);
  }

  warn(context: Loggeable, message: string, ...args: unknown[]): void {
    const safeArgs = this.safeSerialize(args);
    terminal.warn(`[WARN] [${context._logContext}] ${message}`, ...safeArgs);
  }

  error(context: Loggeable, message: string, ...args: unknown[]): void {
    const safeArgs = this.safeSerialize(args);
    terminal.error(`[ERROR] [${context._logContext}] ${message}`, ...safeArgs);
  }
}
