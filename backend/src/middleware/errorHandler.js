import { logger } from '../utils/logger.js';
import { env } from '../config/env.js';

/**
 * Global RFC 7807 Problem Details Error Handler
 */
export function errorHandler(err, req, res, _next) {
  let status = err.statusCode || err.status || 500;
  let title = err.title || 'Internal Server Error';
  let detail = err.message || 'An unexpected internal error occurred on the wealth platform.';
  let type = err.type || 'https://api.ips-wealth.com/errors/internal-server-error';
  let errors = err.errors || undefined;

  // Handle Mongoose Validation Error
  if (err.name === 'ValidationError') {
    status = 400;
    title = 'Database Validation Failed';
    type = 'https://api.ips-wealth.com/errors/database-validation';
    errors = Object.values(err.errors).map((val) => ({
      name: val.path,
      reason: val.message,
    }));
    detail = 'One or more schema fields failed persistence validation constraints.';
  }

  // Handle Mongoose CastError (e.g. malformed ObjectId)
  else if (err.name === 'CastError') {
    status = 400;
    title = 'Malformed Resource Identifier';
    type = 'https://api.ips-wealth.com/errors/malformed-id';
    detail = `Resource identifier format for '${err.path}' is invalid.`;
  }

  // Handle MongoDB Duplicate Key (E11000)
  else if (err.code === 11000) {
    status = 409;
    title = 'Resource Conflict';
    type = 'https://api.ips-wealth.com/errors/resource-conflict';
    const field = Object.keys(err.keyValue || {})[0] || 'uniqueField';
    detail = `A resource with that ${field} already exists in the system.`;
  }

  // Handle Body-Parser JSON Syntax Error
  else if (err instanceof SyntaxError && err.status === 400 && 'body' in err) {
    status = 400;
    title = 'Malformed JSON Payload';
    type = 'https://api.ips-wealth.com/errors/malformed-json';
    detail = 'The request payload contains syntactically invalid JSON.';
  }

  // Log error using structured pino logger
  if (status >= 500) {
    logger.error(
      {
        err: {
          name: err.name,
          message: err.message,
          stack: err.stack,
        },
        url: req.originalUrl,
        method: req.method,
        userId: req.user?._id,
      },
      'Unhandled Server Exception Encountered'
    );
  } else {
    logger.warn(
      {
        status,
        title,
        detail,
        url: req.originalUrl,
        method: req.method,
      },
      'Client Request Error Handled'
    );
  }

  // Format response in strict compliance with RFC 7807
  const response = {
    type,
    title,
    status,
    detail,
    instance: req.originalUrl,
    errors,
    timestamp: new Date().toISOString(),
  };

  // Stack trace exposed strictly in local development mode
  if (env.NODE_ENV === 'development' && status >= 500) {
    response.stack = err.stack;
  }

  return res.status(status).json(response);
}

