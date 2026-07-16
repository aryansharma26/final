import { v2 as cloudinary } from 'cloudinary';

const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

const isConfigured = cloudName && apiKey && apiSecret && cloudName !== 'test' && apiKey !== 'test' && apiSecret !== 'test';

if (!isConfigured) {
  console.warn('[Cloudinary] Missing or invalid Cloudinary credentials (cloud_name, api_key, or api_secret). Image uploads will fail.');
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

export const isCloudinaryConfigured = () => {
  const c = process.env.CLOUDINARY_CLOUD_NAME;
  const k = process.env.CLOUDINARY_API_KEY;
  const s = process.env.CLOUDINARY_API_SECRET;
  return !!(c && k && s && c !== 'test' && k !== 'test' && s !== 'test');
};

export default cloudinary;
