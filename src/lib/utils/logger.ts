type LogLevel = 'debug' | 'info' | 'warn' | 'error';

const levelOrder: Record<LogLevel, number> = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40,
};

const envLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || (process.env.NODE_ENV === 'production' ? 'info' : 'debug');

function shouldLog(level: LogLevel): boolean {
  return levelOrder[level] >= levelOrder[envLevel];
}

export const logger = {
  debug: (...args: unknown[]) => { if (shouldLog('debug')) console.debug('[debug]', ...args); },
  info: (...args: unknown[]) => { if (shouldLog('info')) console.info('[info]', ...args); },
  warn: (...args: unknown[]) => { if (shouldLog('warn')) console.warn('[warn]', ...args); },
  error: (...args: unknown[]) => { if (shouldLog('error')) console.error('[error]', ...args); },
};


