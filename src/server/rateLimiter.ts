import rateLimit from 'express-rate-limit';

export function createRateLimiter(message: string | object) {
  return rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: message,
  });
}
