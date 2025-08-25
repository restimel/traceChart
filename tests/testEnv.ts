import pkg from '../package.json';

/* eslint-disable-next-line @typescript-eslint/no-explicit-any */
(globalThis as any).__APP_VERSION__ = pkg.version;
