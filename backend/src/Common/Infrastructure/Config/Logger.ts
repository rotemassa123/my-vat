import { createLogger, format, Logger, transports } from 'winston';
import * as httpContext from 'express-http-context';
import * as Transport from 'winston-transport';

const addMetadataFormat = format((info) => {
  const metadata = httpContext.get('metadata');
  return metadata ? { ...info, ...metadata } : info;
});

const getTransports = (): Transport[] => {
  if (process.env.NODE_ENV === 'test') {
    return [new transports.Console({ level: 'error' })];
  }
  return [new transports.Console()];
};

const winLogger: Logger = createLogger({
  exitOnError: false,
  format: format.combine(
      format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      addMetadataFormat(),
      format.json()
  ),
  transports: getTransports(),
});

export const logger = {
  error(message: string, serviceName?: string, meta?: any, callback?: any): Logger {
    logger.setLogParameters(meta, serviceName);
    return winLogger.error(message, { ...meta, serviceName }, callback);
  },
  warn(message: string, serviceName?: string, meta?: any, callback?: any): Logger {
    logger.setLogParameters(meta, serviceName);
    return winLogger.warn(message, { ...meta, serviceName }, callback);
  },
  info(message: string, serviceName?: string, meta?: any, callback?: any): Logger {
    logger.setLogParameters(meta, serviceName);
    return winLogger.info(message, { ...meta, serviceName }, callback);
  },
  debug(message: string, serviceName?: string, meta?: any, callback?: any): Logger {
    logger.setLogParameters(meta, serviceName);
    return winLogger.debug(message, { ...meta, serviceName }, callback);
  },

  setLogParameters(logParams: any, serviceName?: string): void {
    const metadata = httpContext.get('metadata') || {};
    if (logParams || serviceName) {
      logParams = { ...logParams, ...metadata, serviceName };
      httpContext.set('metadata', logParams);
    }
  }
};
