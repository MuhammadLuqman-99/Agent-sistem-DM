// Production Logger - Structured logging for enterprise use
import { config } from '../config/index.js';

class Logger {
  constructor() {
    this.level = config.server.logLevel || 'info';
    this.env = config.server.env;
  }

  // Format log entry with timestamp and metadata
  formatLog(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      environment: this.env,
      ...meta
    };

    return JSON.stringify(logEntry);
  }

  // Check if level should be logged
  shouldLog(level) {
    const levels = {
      error: 0,
      warn: 1,
      info: 2,
      debug: 3
    };

    return levels[level] <= levels[this.level];
  }

  // Log methods
  error(message, meta = {}) {
    if (this.shouldLog('error')) {
      console.error(this.formatLog('error', message, {
        ...meta,
        stack: meta.error?.stack || new Error().stack
      }));
    }
  }

  warn(message, meta = {}) {
    if (this.shouldLog('warn')) {
      console.warn(this.formatLog('warn', message, meta));
    }
  }

  info(message, meta = {}) {
    if (this.shouldLog('info')) {
      console.info(this.formatLog('info', message, meta));
    }
  }

  debug(message, meta = {}) {
    if (this.shouldLog('debug')) {
      console.log(this.formatLog('debug', message, meta));
    }
  }

  // API request logging
  logRequest(req, res, responseTime) {
    this.info('API Request', {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      responseTime: `${responseTime}ms`,
      contentLength: res.get('Content-Length') || 0
    });
  }

  // Error logging for API
  logError(error, req = null, context = '') {
    const meta = {
      error: {
        message: error.message,
        stack: error.stack,
        name: error.name
      },
      context
    };

    if (req) {
      meta.request = {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        body: req.method === 'POST' ? JSON.stringify(req.body) : undefined
      };
    }

    this.error('Application Error', meta);
  }

  // Business logic logging
  logBusiness(action, details = {}) {
    this.info(`Business Action: ${action}`, {
      action,
      ...details,
      timestamp: new Date().toISOString()
    });
  }

  // Security event logging
  logSecurity(event, details = {}) {
    this.warn(`Security Event: ${event}`, {
      event,
      ...details,
      timestamp: new Date().toISOString(),
      severity: 'high'
    });
  }

  // Performance logging
  logPerformance(operation, duration, details = {}) {
    this.info(`Performance: ${operation}`, {
      operation,
      duration: `${duration}ms`,
      ...details
    });
  }
}

export default new Logger();