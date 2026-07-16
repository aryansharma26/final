const requiredProductionEnv = [
  'MONGODB_URI',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'FRONTEND_URL',
  'CLOUDINARY_CLOUD_NAME',
  'CLOUDINARY_API_KEY',
  'CLOUDINARY_API_SECRET',
  'SMTP_HOST',
  'SMTP_USER',
  'SMTP_PASS',
];

const isLocalUrl = (value) => /localhost|127\.0\.0\.1/i.test(String(value || ''));

export const validateRuntimeEnv = () => {
  if (process.env.NODE_ENV !== 'production') return;

  const missing = requiredProductionEnv.filter((key) => !process.env[key]);
  if (missing.length > 0) {
    throw new Error(`FATAL: Missing required production environment variables: ${missing.join(', ')}`);
  }

  if (isLocalUrl(process.env.FRONTEND_URL)) {
    throw new Error('FATAL: FRONTEND_URL must not point to localhost in production');
  }
};
