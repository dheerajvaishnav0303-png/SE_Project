import { ZodError } from 'zod';

/**
 * Higher-order middleware to validate incoming request data using Zod schemas.
 * @param {object} schemas - Object containing optional body, query, and params schemas.
 * @param {import('zod').ZodTypeAny} [schemas.body]
 * @param {import('zod').ZodTypeAny} [schemas.query]
 * @param {import('zod').ZodTypeAny} [schemas.params]
 */
export function validateRequest(schemas) {
  return async (req, res, next) => {
    try {
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      if (schemas.query) {
        req.query = await schemas.query.parseAsync(req.query);
      }
      if (schemas.params) {
        req.params = await schemas.params.parseAsync(req.params);
      }
      return next();
    } catch (error) {
      if (error instanceof ZodError) {
        const invalidParams = error.errors.map((err) => ({
          name: err.path.join('.'),
          reason: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          type: 'https://api.ips-wealth.com/errors/invalid-request-payload',
          title: 'Invalid Request Parameters',
          status: 400,
          detail: 'One or more parameters in the request payload failed validation constraints.',
          instance: req.originalUrl,
          errors: invalidParams,
          timestamp: new Date().toISOString(),
        });
      }
      return next(error);
    }
  };
}

