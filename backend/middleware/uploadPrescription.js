import multer from 'multer';
import path from 'path';

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);
  if (extname && mimetype) {
    return cb(null, true);
  }
  cb(new Error('Only JPG, PNG, and PDF files are allowed'));
};

const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter,
}).single('prescription');

export const uploadPrescription = (req, res, next) => {
  upload(req, res, (err) => {
    if (!err) {
      return next();
    }

    const message = err.code === 'LIMIT_FILE_SIZE'
      ? 'Prescription file must be 10MB or less'
      : err.message || 'Prescription upload failed';
    return res.status(400).json({ success: false, message });
  });
};
