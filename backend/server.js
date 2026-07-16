import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoose from 'mongoose';
import connectDB from './config/db.js';
import { validateRuntimeEnv } from './config/env.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { errorHandler, notFound } from './middleware/errorHandler.js';

import authRoutes from './routes/auth.js';
import userRoutes from './routes/user.js';
import productRoutes from './routes/product.js';
import categoryRoutes from './routes/category.js';
import cartRoutes from './routes/cart.js';
import wishlistRoutes from './routes/wishlist.js';
import orderRoutes from './routes/order.js';
import reviewRoutes from './routes/review.js';
import couponRoutes from './routes/coupon.js';
import contactRoutes from './routes/contact.js';
import prescriptionRoutes from './routes/prescription.js';
import adminRoutes from './routes/admin.js';
import doctorRoutes from './routes/doctor.js';
import b2bProductRoutes from './routes/b2bProduct.js';
import b2bCouponRoutes from './routes/b2bCoupon.js';
import settingRoutes from './routes/setting.js';

validateRuntimeEnv();
connectDB();

const app = express();
const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
const apiUrl = process.env.API_URL || process.env.BACKEND_URL;
const connectSrc = ["'self'", frontendUrl, ...(apiUrl ? [apiUrl] : [])];

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      scriptSrc: ["'self'"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https://res.cloudinary.com", "https://images.unsplash.com"],
      connectSrc,
    },
  },
}));

app.use(cors({
  origin: frontendUrl,
  credentials: true,
}));

// Logging - only in development
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
} else {
  app.use(morgan('combined'));
}

// Increase JSON limit for prescription uploads only — MUST come before the global express.json() so this route-specific limit is respected.
app.use('/api/prescriptions', express.json({ limit: '10mb' }));

app.use(express.json({ limit: '100kb' }));
app.use(express.urlencoded({ extended: true, limit: '100kb' }));
app.use(cookieParser());

// Global rate limiting
app.use(apiLimiter);

// Conditionally add NoSQL injection and HPP protection if packages are available
try {
  const mongoSanitize = (await import('express-mongo-sanitize')).default;
  app.use(mongoSanitize());
} catch {
  console.warn('[Server] express-mongo-sanitize not installed. Install with: npm install express-mongo-sanitize');
}

try {
  const hpp = (await import('hpp')).default;
  app.use(hpp());
} catch {
  console.warn('[Server] hpp not installed. Install with: npm install hpp');
}

try {
  const compression = (await import('compression')).default;
  app.use(compression());
} catch {
  console.warn('[Server] compression not installed. Install with: npm install compression');
}

// HTTPS redirect in production
if (process.env.NODE_ENV === 'production') {
  app.use((req, res, next) => {
    if (req.headers['x-forwarded-proto'] !== 'https') {
      return res.redirect(301, `https://${req.headers.host}${req.url}`);
    }
    next();
  });
}

// Prescription files are served via authenticated controller, not static
// REMOVE: app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/wishlist', wishlistRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/coupons', couponRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/prescriptions', prescriptionRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/doctors', doctorRoutes);
app.use('/api/b2b-products', b2bProductRoutes);
app.use('/api/b2b-coupons', b2bCouponRoutes);
app.use('/api/settings', settingRoutes);

// Health check with DB dependency
app.get('/api/health', async (req, res) => {
  const dbState = mongoose.connection.readyState;
  if (dbState !== 1) {
    return res.status(503).json({ success: false, message: 'Database unavailable', timestamp: new Date().toISOString() });
  }
  res.json({ success: true, message: 'Capsandpills API is running', timestamp: new Date().toISOString() });
});

app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Request timeout
server.setTimeout(30000);

// Graceful shutdown
const gracefulShutdown = async (signal) => {
  console.log(`\n${signal} received. Shutting down gracefully...`);
  server.close(() => {
    console.log('HTTP server closed.');
  });
  try {
    await mongoose.connection.close(false);
    console.log('MongoDB connection closed.');
  } catch (err) {
    console.error('Error closing MongoDB connection:', err.message);
  }
  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err.message);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err.message);
  gracefulShutdown('UNCAUGHT_EXCEPTION');
});

export default app;
