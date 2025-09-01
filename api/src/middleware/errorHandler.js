// Comprehensive Error Handler for Production
import logger from '../utils/logger.js';
import { config } from '../config/index.js';

// Custom error classes
export class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = 'ValidationError';
    this.statusCode = 400;
    this.details = details;
  }
}

export class AuthenticationError extends Error {
  constructor(message = 'Authentication failed') {
    super(message);
    this.name = 'AuthenticationError';
    this.statusCode = 401;
  }
}

export class AuthorizationError extends Error {
  constructor(message = 'Insufficient permissions') {
    super(message);
    this.name = 'AuthorizationError';
    this.statusCode = 403;
  }
}

export class NotFoundError extends Error {
  constructor(message = 'Resource not found') {
    super(message);
    this.name = 'NotFoundError';
    this.statusCode = 404;
  }
}

export class BusinessLogicError extends Error {
  constructor(message, statusCode = 422) {
    super(message);
    this.name = 'BusinessLogicError';
    this.statusCode = statusCode;
  }
}

export class ExternalServiceError extends Error {
  constructor(service, message, originalError = null) {
    super(`${service} service error: ${message}`);
    this.name = 'ExternalServiceError';
    this.statusCode = 503;
    this.service = service;
    this.originalError = originalError;
  }
}

// Error response formatter
const formatErrorResponse = (error, req) => {
  const isDevelopment = config.server.env === 'development';
  const isTest = config.server.env === 'test';

  const response = {
    success: false,
    error: error.message,
    timestamp: new Date().toISOString(),
    requestId: req.id || 'unknown'
  };

  // Add error details for specific error types
  if (error instanceof ValidationError) {
    response.details = error.details;
    response.type = 'validation_error';
  }

  if (error instanceof ExternalServiceError) {
    response.service = error.service;
    response.type = 'service_error';
  }

  // Add stack trace in development/test
  if ((isDevelopment || isTest) && error.stack) {
    response.stack = error.stack;
  }

  // Add additional context for business logic errors
  if (error instanceof BusinessLogicError) {
    response.type = 'business_logic_error';
  }

  return response;
};

// Main error handler middleware
export const errorHandler = (error, req, res, next) => {
  // Log the error
  logger.logError(error, req, 'Error Handler Middleware');

  // Determine status code
  let statusCode = error.statusCode || error.status || 500;

  // Handle specific error types
  if (error.code === 'EBADCSRFTOKEN') {
    statusCode = 403;
    error.message = 'Invalid CSRF token. Please refresh the page and try again.';
    logger.logSecurity('CSRF Token Violation', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      url: req.originalUrl
    });
  }

  if (error.code === 'LIMIT_FILE_SIZE') {
    statusCode = 413;
    error.message = 'File size too large';
  }

  if (error.name === 'SyntaxError' && error.type === 'entity.parse.failed') {
    statusCode = 400;
    error.message = 'Invalid JSON in request body';
  }

  // Handle mongoose/database errors
  if (error.name === 'CastError') {
    statusCode = 400;
    error.message = 'Invalid ID format';
  }

  if (error.name === 'MongoServerError' && error.code === 11000) {
    statusCode = 409;
    error.message = 'Duplicate entry exists';
  }

  // Handle JWT errors
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    error.message = 'Invalid authentication token';
  }

  if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    error.message = 'Authentication token expired';
  }

  // Send formatted response
  res.status(statusCode).json(formatErrorResponse(error, req));
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new NotFoundError(`Route ${req.originalUrl} not found`);
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  next(error);
};

// Graceful shutdown error handler
export const shutdownHandler = (error) => {
  logger.error('Unexpected error during shutdown', {
    error: {
      message: error.message,
      stack: error.stack
    }
  });
  process.exit(1);
};

// Unhandled promise rejection handler
export const unhandledRejectionHandler = (reason, promise) => {
  logger.error('Unhandled Promise Rejection', {
    reason: reason?.message || reason,
    stack: reason?.stack
  });
  
  // In production, gracefully close the server
  if (config.server.env === 'production') {
    process.exit(1);
  }
};

// Uncaught exception handler
export const uncaughtExceptionHandler = (error) => {
  logger.error('Uncaught Exception', {
    error: {
      message: error.message,
      stack: error.stack
    }
  });
  
  // Always exit on uncaught exceptions
  process.exit(1);
};