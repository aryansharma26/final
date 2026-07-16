import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: (req) => {
    // Skip rate limiting for admin login in development
    if (process.env.NODE_ENV === 'development') return 5000;
    return 200;
  },
  message: { success: false, message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: (req) => {
    // Skip rate limiting entirely in development
    return process.env.NODE_ENV === 'development';
  },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { success: false, message: 'Too many auth attempts, please try again later.' },
  skip: (req) => {
    return process.env.NODE_ENV === 'development';
  },
});
