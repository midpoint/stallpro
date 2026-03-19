// server/api/index.js - Vercel API 入口
const connectDB = require('../config/database');

module.exports = async (req, res) => {
  try {
    // 连接数据库
    await connectDB();

    res.status(200).json({
      success: true,
      message: '摆摊666 API',
      version: '1.0.0'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
};
