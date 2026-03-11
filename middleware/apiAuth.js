// ============= middleware/apiAuth.js =============
// میدلور احراز هویت درخواست‌های API

const { ApiKey, ApiLog } = require('../models');
const { Op } = require('sequelize');

const apiAuth = async (req, res, next) => {
  const startTime = Date.now();
  const apiKey = req.header('X-API-Key');
  const apiSecret = req.header('X-API-Secret');
  
  // مسیرهای عمومی نیاز به احراز هویت ندارند
  const publicPaths = ['/api/lessons', '/api/brokers', '/api/events', '/api/contact', '/api/user/register'];
  if (publicPaths.includes(req.path) && req.method === 'GET') {
    return next();
  }
  
  if (!apiKey || !apiSecret) {
    await logRequest(req, null, 401, startTime);
    return res.status(401).json({ 
      success: false, 
      error: 'API Key and Secret are required' 
    });
  }
  
  try {
    // بررسی اعتبار کلید
    const key = await ApiKey.findOne({
      where: {
        key: apiKey,
        secret: apiSecret,
        isActive: true,
        [Op.or]: [
          { expiresAt: null },
          { expiresAt: { [Op.gt]: new Date() } }
        ]
      }
    });
    
    if (!key) {
      await logRequest(req, null, 403, startTime);
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired API key' 
      });
    }
    
    // به‌روزرسانی آخرین استفاده
    await key.update({ lastUsed: new Date() });
    
    // افزودن اطلاعات کلید به req برای استفاده در ادامه
    req.apiKey = key;
    
    await logRequest(req, key.id, 200, startTime);
    next();
    
  } catch (error) {
    console.error('API Auth Error:', error);
    await logRequest(req, null, 500, startTime);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error' 
    });
  }
};

// تابع کمکی برای ثبت لاگ
async function logRequest(req, apiKeyId, statusCode, startTime) {
  try {
    const responseTime = Date.now() - startTime;
    
    await ApiLog.create({
      apiKeyId,
      endpoint: req.path,
      method: req.method,
      statusCode,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      responseTime
    });
  } catch (error) {
    console.error('Error logging API request:', error);
  }
}

module.exports = apiAuth;