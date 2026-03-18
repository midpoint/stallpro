// server/api/health.js - Vercel Serverless Function 示例
module.exports = async (req, res) => {
  res.status(200).json({
    status: 'ok',
    time: new Date().toISOString(),
    message: '摆摊助手 API 运行中'
  });
};
