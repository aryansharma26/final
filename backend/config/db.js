import mongoose from 'mongoose';

let isConnected = false;
let retryCount = 0;
const MAX_RETRIES = 5;
const RETRY_DELAY_MS = 3000;

const connectDB = async () => {
  if (isConnected) {
    console.log('MongoDB already connected (reusing connection)');
    return;
  }

  if (!process.env.MONGODB_URI) {
    console.error('FATAL: MONGODB_URI environment variable is required');
    process.exit(1);
  }

  const options = {
    maxPoolSize: 20,
    minPoolSize: 5,
    serverSelectionTimeoutMS: 30000,
    connectTimeoutMS: 10000,
    socketTimeoutMS: 45000,
    heartbeatFrequencyMS: 10000,
    bufferCommands: true,
    family: 4,
  };

  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI, options);
    isConnected = true;
    retryCount = 0;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    retryCount++;
    console.error(`MongoDB Connection Error (attempt ${retryCount}/${MAX_RETRIES}): ${error.message}`);
    
    if (retryCount < MAX_RETRIES) {
      console.log(`Retrying in ${RETRY_DELAY_MS}ms...`);
      await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
      return connectDB();
    }
    
    console.error('FATAL: Max retries exceeded. Exiting.');
    process.exit(1);
  }
};

// Connection event handlers
mongoose.connection.on('error', (err) => {
  console.error(`MongoDB connection error: ${err.message}`);
});

mongoose.connection.on('disconnected', () => {
  console.warn('MongoDB disconnected! Attempting to reconnect...');
  isConnected = false;
});

mongoose.connection.on('reconnected', () => {
  console.log('MongoDB reconnected successfully');
  isConnected = true;
  retryCount = 0;
});

mongoose.connection.on('close', () => {
  console.log('MongoDB connection closed');
  isConnected = false;
});

export default connectDB;
