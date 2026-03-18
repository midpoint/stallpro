const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'stallpro-secret-key';

// 认证中间件
module.exports = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: '请先登录'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: '登录已过期，请重新登录'
    });
  }
};
