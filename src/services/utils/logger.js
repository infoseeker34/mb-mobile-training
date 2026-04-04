const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const MIN_LEVEL = __DEV__ ? LOG_LEVELS.debug : LOG_LEVELS.warn;

const logger = {
  debug(...args) {
    if (MIN_LEVEL <= LOG_LEVELS.debug) console.log('[DEBUG]', ...args);
  },
  info(...args) {
    if (MIN_LEVEL <= LOG_LEVELS.info) console.log('[INFO]', ...args);
  },
  warn(...args) {
    if (MIN_LEVEL <= LOG_LEVELS.warn) console.warn('[WARN]', ...args);
  },
  error(...args) {
    if (MIN_LEVEL <= LOG_LEVELS.error) console.error('[ERROR]', ...args);
  },
};

export default logger;
