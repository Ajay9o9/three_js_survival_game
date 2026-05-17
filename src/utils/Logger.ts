/**
 * Simple debug logger with category support and toggleable verbosity.
 */
export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

export class Logger {
  private static level: LogLevel = LogLevel.DEBUG;
  private static enabled = true;

  static setLevel(level: LogLevel): void {
    Logger.level = level;
  }

  static toggle(): void {
    Logger.enabled = !Logger.enabled;
  }

  static debug(category: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.DEBUG && Logger.enabled) {
      console.log(`%c[DEBUG] ${category}`, 'color: #00bfff;', ...args);
    }
  }

  static info(category: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.INFO && Logger.enabled) {
      console.log(`%c[INFO] ${category}`, 'color: #4CAF50;', ...args);
    }
  }

  static warn(category: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.WARN && Logger.enabled) {
      console.warn(`%c[WARN] ${category}`, 'color: #FF9800;', ...args);
    }
  }

  static error(category: string, ...args: unknown[]): void {
    if (Logger.level <= LogLevel.ERROR && Logger.enabled) {
      console.error(`%c[ERROR] ${category}`, 'color: #f44336;', ...args);
    }
  }
}
