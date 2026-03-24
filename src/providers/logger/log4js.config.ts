import * as fs from 'node:fs';
import * as path from 'node:path';

import type { Configuration } from 'log4js';

export const createLog4jsConfig = (logDir: string, level: string): Configuration => {
  fs.mkdirSync(logDir, { recursive: true });

  return {
    appenders: {
      console: {
        type: 'stdout',
      },
      application: {
        type: 'dateFile',
        filename: path.join(logDir, 'application.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        alwaysIncludePattern: true,
        numBackups: 15,
        layout: {
          type: 'pattern',
          pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] %m',
        },
      },
      error: {
        type: 'dateFile',
        filename: path.join(logDir, 'error.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        alwaysIncludePattern: true,
        numBackups: 30,
        layout: {
          type: 'pattern',
          pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] %m',
        },
      },
      access: {
        type: 'dateFile',
        filename: path.join(logDir, 'access.log'),
        pattern: 'yyyy-MM-dd',
        keepFileExt: true,
        alwaysIncludePattern: true,
        numBackups: 15,
        layout: {
          type: 'pattern',
          pattern: '[%d{yyyy-MM-dd hh:mm:ss}] [%p] [%c] %m',
        },
      },
    },
    categories: {
      default: {
        appenders: ['console', 'application'],
        level,
      },
      app: {
        appenders: ['console', 'application'],
        level,
      },
      error: {
        appenders: ['console', 'error'],
        level: 'error',
      },
      access: {
        appenders: ['console', 'access'],
        level: 'info',
      },
    },
  };
};
