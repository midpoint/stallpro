// server/db.js - MongoDB连接
const mongoose = require('mongoose');

// MongoDB连接字符串（从环境变量或默认）
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/stallpro';

let isConnected = false;

const connectDB = async () => {
  if (isConnected) {
    return;
  }

  try {
    const db = await mongoose.connect(MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = db.connections[0].readyState === 1;
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    // 如果连接失败，使用内存数据
    console.log('Using in-memory data instead');
  }
};

module.exports = connectDB;
