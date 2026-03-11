// ============= controllers/apiController.js =============
// کنترلر مدیریت تنظیمات API و کلیدهای دسترسی

const { ApiKey, ApiEndpoint, ApiLog } = require('../models');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

// ============= صفحه اصلی تنظیمات API =============
const apiSettingsIndex = async (req, res) => {
  try {
    // دریافت لیست کلیدهای API
    const apiKeys = await ApiKey.findAll({
      order: [['createdAt', 'DESC']]
    });

    // دریافت لیست اندپوینت‌های فعال
    const endpoints = await ApiEndpoint.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });

    // دریافت آمار آخرین ۱۰ درخواست
    const recentLogs = await ApiLog.findAll({
      limit: 10,
      order: [['createdAt', 'DESC']],
      include: [{ model: ApiKey, as: 'apiKey', attributes: ['name'] }]
    });

    res.render('api', {
      title: 'تنظیمات API',
      user: req.session.adminUsername,
      activePage: 'api',
      apiKeys: apiKeys,
      endpoints: endpoints,
      recentLogs: recentLogs,
      stats: {
        totalKeys: apiKeys.length,
        activeKeys: apiKeys.filter(k => k.isActive).length,
        totalEndpoints: endpoints.length,
        todayRequests: await ApiLog.count({
          where: {
            createdAt: {
              [Op.gte]: new Date(new Date().setHours(0, 0, 0, 0))
            }
          }
        })
      }
    });

  } catch (error) {
    console.error('❌ خطا در بارگذاری صفحه API:', error);
    res.status(500).render('error', {
      title: 'خطا',
      message: 'خطا در بارگذاری صفحه تنظیمات API',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.session.adminUsername
    });
  }
};

// ============= مدیریت کلیدهای API =============

// دریافت لیست کلیدها
const getApiKeys = async (req, res) => {
  try {
    const keys = await ApiKey.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: keys });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد کلید جدید
const createApiKey = async (req, res) => {
  try {
    const { name, permissions, expiresIn } = req.body;

    if (!name) {
      return res.status(400).json({ 
        success: false, 
        error: 'نام کلید الزامی است' 
      });
    }

    // تولید کلید یکتا
    const key = 'pk_' + crypto.randomBytes(24).toString('hex');
    const secret = 'sk_' + crypto.randomBytes(32).toString('hex');

    // محاسبه تاریخ انقضا
    let expiresAt = null;
    if (expiresIn && expiresIn !== 'never') {
      const days = parseInt(expiresIn);
      expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + days);
    }

    const newKey = await ApiKey.create({
      name,
      key,
      secret,
      permissions: permissions || ['read'],
      expiresAt,
      isActive: true,
      lastUsed: null
    });

    // لاگ عملیات
    await ApiLog.create({
      apiKeyId: newKey.id,
      endpoint: 'POST /api/keys',
      method: 'CREATE',
      statusCode: 201,
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });

    res.status(201).json({ 
      success: true, 
      data: newKey,
      message: 'کلید API با موفقیت ایجاد شد'
    });

  } catch (error) {
    console.error('❌ خطا در ایجاد کلید API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش کلید
const updateApiKey = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, permissions, isActive, expiresIn } = req.body;

    const apiKey = await ApiKey.findByPk(id);
    if (!apiKey) {
      return res.status(404).json({ 
        success: false, 
        error: 'کلید یافت نشد' 
      });
    }

    // به‌روزرسانی فیلدها
    if (name) apiKey.name = name;
    if (permissions) apiKey.permissions = permissions;
    if (isActive !== undefined) apiKey.isActive = isActive;

    // به‌روزرسانی تاریخ انقضا
    if (expiresIn) {
      if (expiresIn === 'never') {
        apiKey.expiresAt = null;
      } else {
        const days = parseInt(expiresIn);
        apiKey.expiresAt = new Date();
        apiKey.expiresAt.setDate(apiKey.expiresAt.getDate() + days);
      }
    }

    await apiKey.save();

    res.json({ 
      success: true, 
      data: apiKey,
      message: 'کلید با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('❌ خطا در ویرایش کلید API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف کلید
const deleteApiKey = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findByPk(id);
    if (!apiKey) {
      return res.status(404).json({ 
        success: false, 
        error: 'کلید یافت نشد' 
      });
    }

    // حذف تمام لاگ‌های مرتبط
    await ApiLog.destroy({ where: { apiKeyId: id } });
    
    // حذف کلید
    await apiKey.destroy();

    res.json({ 
      success: true, 
      message: 'کلید با موفقیت حذف شد' 
    });

  } catch (error) {
    console.error('❌ خطا در حذف کلید API:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// بازتولید سکرت کلید
const regenerateSecret = async (req, res) => {
  try {
    const { id } = req.params;

    const apiKey = await ApiKey.findByPk(id);
    if (!apiKey) {
      return res.status(404).json({ 
        success: false, 
        error: 'کلید یافت نشد' 
      });
    }

    // تولید سکرت جدید
    const newSecret = 'sk_' + crypto.randomBytes(32).toString('hex');
    apiKey.secret = newSecret;
    await apiKey.save();

    res.json({ 
      success: true, 
      secret: newSecret,
      message: 'سکرت کلید با موفقیت بازتولید شد'
    });

  } catch (error) {
    console.error('❌ خطا در بازتولید سکرت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت اندپوینت‌ها =============

// دریافت لیست اندپوینت‌ها
const getEndpoints = async (req, res) => {
  try {
    const endpoints = await ApiEndpoint.findAll({
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: endpoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد اندپوینت جدید
const createEndpoint = async (req, res) => {
  try {
    const { name, path, method, description, category, requiresAuth, permissions } = req.body;

    if (!name || !path || !method) {
      return res.status(400).json({ 
        success: false, 
        error: 'نام، مسیر و متد الزامی هستند' 
      });
    }

    const endpoint = await ApiEndpoint.create({
      name,
      path,
      method: method.toUpperCase(),
      description,
      category,
      requiresAuth: requiresAuth !== false,
      permissions: permissions || [],
      isActive: true
    });

    res.status(201).json({ 
      success: true, 
      data: endpoint,
      message: 'اندپوینت با موفقیت ایجاد شد'
    });

  } catch (error) {
    console.error('❌ خطا در ایجاد اندپوینت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش اندپوینت
const updateEndpoint = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ 
        success: false, 
        error: 'اندپوینت یافت نشد' 
      });
    }

    await endpoint.update(updates);

    res.json({ 
      success: true, 
      data: endpoint,
      message: 'اندپوینت با موفقیت به‌روزرسانی شد'
    });

  } catch (error) {
    console.error('❌ خطا در ویرایش اندپوینت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف اندپوینت
const deleteEndpoint = async (req, res) => {
  try {
    const { id } = req.params;

    const endpoint = await ApiEndpoint.findByPk(id);
    if (!endpoint) {
      return res.status(404).json({ 
        success: false, 
        error: 'اندپوینت یافت نشد' 
      });
    }

    await endpoint.destroy();

    res.json({ 
      success: true, 
      message: 'اندپوینت با موفقیت حذف شد' 
    });

  } catch (error) {
    console.error('❌ خطا در حذف اندپوینت:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت لاگ‌ها =============

// دریافت لاگ‌ها
const getLogs = async (req, res) => {
  try {
    const { page = 1, limit = 50, keyId } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (keyId) where.apiKeyId = keyId;

    const { count, rows } = await ApiLog.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']],
      include: [{ model: ApiKey, as: 'apiKey', attributes: ['name', 'key'] }]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });

  } catch (error) {
    console.error('❌ خطا در دریافت لاگ‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// پاک کردن لاگ‌های قدیمی
const clearLogs = async (req, res) => {
  try {
    const { days = 30 } = req.body;
    const date = new Date();
    date.setDate(date.getDate() - days);

    const deleted = await ApiLog.destroy({
      where: {
        createdAt: {
          [Op.lt]: date
        }
      }
    });

    res.json({
      success: true,
      message: `${deleted} لاگ قدیمی پاک شدند`
    });

  } catch (error) {
    console.error('❌ خطا در پاک کردن لاگ‌ها:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= آمار و تحلیل =============

// دریافت آمار کلی
const getStats = async (req, res) => {
  try {
    const now = new Date();
    const startOfDay = new Date(now.setHours(0, 0, 0, 0));
    const startOfWeek = new Date(now.setDate(now.getDate() - 7));
    const startOfMonth = new Date(now.setMonth(now.getMonth() - 1));

    const [totalKeys, activeKeys, todayRequests, weekRequests, monthRequests] = await Promise.all([
      ApiKey.count(),
      ApiKey.count({ where: { isActive: true } }),
      ApiLog.count({ where: { createdAt: { [Op.gte]: startOfDay } } }),
      ApiLog.count({ where: { createdAt: { [Op.gte]: startOfWeek } } }),
      ApiLog.count({ where: { createdAt: { [Op.gte]: startOfMonth } } })
    ]);

    // پرکاربردترین اندپوینت‌ها
    const topEndpoints = await ApiLog.findAll({
      attributes: [
        'endpoint',
        [sequelize.fn('COUNT', sequelize.col('endpoint')), 'count']
      ],
      group: ['endpoint'],
      order: [[sequelize.literal('count'), 'DESC']],
      limit: 5
    });

    res.json({
      success: true,
      data: {
        keys: { total: totalKeys, active: activeKeys },
        requests: {
          today: todayRequests,
          week: weekRequests,
          month: monthRequests
        },
        topEndpoints
      }
    });

  } catch (error) {
    console.error('❌ خطا در دریافت آمار:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  apiSettingsIndex,
  getApiKeys,
  createApiKey,
  updateApiKey,
  deleteApiKey,
  regenerateSecret,
  getEndpoints,
  createEndpoint,
  updateEndpoint,
  deleteEndpoint,
  getLogs,
  clearLogs,
  getStats
};