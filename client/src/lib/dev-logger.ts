const isDev = import.meta.env.DEV;

export const devLog = {
  // errors always log — needed to diagnose production failures
  error: (...args: unknown[]): void => {
    console.error(...args);
  },
  warn: (...args: unknown[]): void => {
    if (isDev) console.warn(...args);
  },
  info: (...args: unknown[]): void => {
    if (isDev) console.info(...args);
  },
};
