import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { generateAccessToken, generateRefreshToken } from '../utils/generateToken.js';
import { sendEmail, getWelcomeEmailTemplate, getPasswordResetTemplate } from '../utils/sendEmail.js';

const ACCESS_TOKEN_MAX_AGE = 15 * 60 * 1000;
const REFRESH_TOKEN_MAX_AGE = 30 * 24 * 60 * 60 * 1000;
const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === 'production',
  sameSite: 'strict',
};

export const register = async (req, res, next) => {
  try {
    const { name, email, password, phone } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 12);
    // isVerified is set to true because email verification is disabled by default in this project.
    const user = await User.create({ name, email, password: hashedPassword, phone, isVerified: true });
    const accessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user._id, tokenVersion: user.tokenVersion });
    user.refreshToken = refreshToken;
    await user.save();
    try {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to Capsandpills!',
        html: getWelcomeEmailTemplate(user.name),
      });
    } catch (emailError) {
      console.error('[Register] Welcome email failed:', emailError.message);
    }
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, isVerified: user.isVerified },
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    // Check if account is disabled
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled. Please contact support.' });
    }
    user.lastLogin = new Date();
    const accessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    const refreshToken = generateRefreshToken({ id: user._id, tokenVersion: user.tokenVersion });
    user.refreshToken = refreshToken;
    await user.save();
    res.cookie('accessToken', accessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.cookie('refreshToken', refreshToken, { ...cookieOptions, maxAge: REFRESH_TOKEN_MAX_AGE });
    res.json({
      success: true,
      message: 'Login successful',
      user: { id: user._id, name: user.name, email: user.email, role: user.role, avatar: user.avatar },
    });
  } catch (error) {
    next(error);
  }
};

export const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await User.findByIdAndUpdate(req.user._id, { refreshToken: null });
    }
    res.clearCookie('accessToken', cookieOptions);
    res.clearCookie('refreshToken', cookieOptions);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    next(error);
  }
};

export const refresh = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken;
    if (!refreshToken) {
      return res.status(401).json({ success: false, message: 'No refresh token' });
    }
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    const user = await User.findById(decoded.id).select('+refreshToken');
    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({ success: false, message: 'Invalid refresh token' });
    }
    // Check if account is disabled
    if (!user.isActive) {
      return res.status(403).json({ success: false, message: 'Account disabled' });
    }
    const newAccessToken = generateAccessToken({ id: user._id, role: user.role, tokenVersion: user.tokenVersion });
    res.cookie('accessToken', newAccessToken, { ...cookieOptions, maxAge: ACCESS_TOKEN_MAX_AGE });
    res.json({ success: true });
  } catch (error) {
    next(error);
  }
};

export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    // Always return the same message to prevent email enumeration
    if (!user) {
      return res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.passwordResetExpires = Date.now() + 30 * 60 * 1000;
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        html: getPasswordResetTemplate(resetUrl),
      });
    } catch (emailError) {
      console.error('[ForgotPassword] Email failed to send to:', user.email);
      // Clear token so unused tokens don't accumulate in DB
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();
    }
    res.json({ success: true, message: 'If an account exists with this email, a password reset link has been sent.' });
  } catch (error) {
    next(error);
  }
};

export const resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }
    user.password = await bcrypt.hash(newPassword, 12);
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    user.refreshToken = null;
    user.tokenVersion += 1;
    await user.save();
    res.json({ success: true, message: 'Password reset successful. Please login again.' });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select('-password -refreshToken');
    res.json({ success: true, user });
  } catch (error) {
    next(error);
  }
};
