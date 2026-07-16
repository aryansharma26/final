import jwt from 'jsonwebtoken';

const validateSecrets = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('FATAL: JWT_SECRET environment variable is required');
  }
  if (!process.env.JWT_REFRESH_SECRET) {
    throw new Error('FATAL: JWT_REFRESH_SECRET environment variable is required');
  }
};

export const generateAccessToken = (payload) => {
  validateSecrets();
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '15m' });
};

export const generateAdminToken = (payload) => {
  validateSecrets();
  return jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '30d' });
};

export const generateRefreshToken = (payload) => {
  validateSecrets();
  return jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
};

export const verifyToken = (token, secret) => {
  return jwt.verify(token, secret);
};
