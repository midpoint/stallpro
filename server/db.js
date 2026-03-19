// server/db.js - MongoDB连接
const mongoose = require('mongoose');

// MongoDB连接字符串（从环境变量或默认）
const MONGODB_URI = process.env.MONGODB_URI || '';

let isConnected = false;

const connectDB = async () => {
  // 如果没有配置MongoDB URI，返回null表示使用内存数据
  if (!MONGODB_URI) {
    console.log('MONGODB_URI not configured, using in-memory data');
    return null;
  }

  if (isConnected) {
    return;
  }

  try {
    await mongoose.connect(MONGODB_URI);
    isConnected = true;
    console.log('MongoDB connected successfully');
    return true;
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    console.log('Using in-memory data instead');
    return null;
  }
};

// mongoose连接事件监听
mongoose.connection.on('error', (err) => {
  console.error('MongoDB error:', err.message);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
  isConnected = false;
});

module.exports = connectDB;
