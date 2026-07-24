export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) {
    return;
  }
  let statusCode = err.statusCode || (res.statusCode === 200 ? 500 : res.statusCode);
  let message = err.message;

  if (err.name === 'CastError') {
    statusCode = 404;
    message = 'Resource not found';
  }
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors).map((e) => e.message).join(', ');
  }
  if (err.code === 11000) {
    statusCode = 400;
    const duplicateField = Object.keys(err.keyPattern || err.keyValue || {})[0];
    if (duplicateField === 'sku') {
      message = 'SKU already exists. Please use a unique SKU.';
    } else if (duplicateField === 'email') {
      message = 'Phone number already exists. Please use a different phone number.';
    } else if (duplicateField === 'phone') {
      message = 'Phone number already exists. Please use a different phone number.';
    } else if (duplicateField === 'slug') {
      message = 'Slug already exists. Please use a unique name or slug.';
    } else {
      message = 'Duplicate field value entered';
    }
  }
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Session expired. Please log in again.';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export const notFound = (req, res, next) => {
  const error = new Error(`Not Found - ${req.originalUrl}`);
  res.status(404);
  next(error);
};
