// 云函数：生成二维码
const cloud = require('wx-server-sdk');

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
});

// 生成小程序码/二维码
exports.main = async (event, context) => {
  const { path, scene } = event;

  if (!path || !scene) {
    return { errMsg: '缺少必要参数', path, scene };
  }

  const sceneStr = String(scene).substring(0, 32);

  // 方法1：尝试生成小程序码（需要已发布）
  try {
    const result = await cloud.openapi.wxacode.getUnlimited({
      scene: sceneStr,
      page: path,
      width: 430
    });

    return {
      buffer: result.buffer,
      errMsg: 'ok',
      type: 'wxacode'
    };
  } catch (err) {
    console.log('小程序码失败:', err.errCode);
  }

  // 方法2：尝试生成URL Scheme（需要已发布）
  try {
    const schemeResult = await cloud.openapi.urlscheme.generate({
      jumpWxa: {
        path: path,
        queryString: `stallId=${scene}`
      },
      expireType: 1,
      expireTime: Math.floor(Date.now() / 1000) + 7 * 24 * 3600
    });

    return {
      scheme: schemeResult.openlink,
      errMsg: 'ok',
      type: 'scheme'
    };
  } catch (err) {
    console.log('URL Scheme失败:', err.errCode);
  }

  // 方法3：返回完整路径，让前端生成普通二维码
  return {
    path: path,
    query: `stallId=${scene}`,
    fullPath: `${path}?stallId=${scene}`,
    errMsg: 'ok',
    type: 'path'
  };
};
