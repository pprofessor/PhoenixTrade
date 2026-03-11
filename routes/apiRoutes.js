const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const { 
  BotMessage, WebappPage, Lesson, Broker, BotUser, Event, 
  BotMenu, ApiKey, ApiLog, ApiEndpoint 
} = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// ============= API آمار داشبورد (نیازمند احراز هویت پنل) =============
router.get('/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
        const [botMessages, webappPages, lessons, brokers, botUsers, events] = await Promise.all([
            BotMessage.findAndCountAll({ where: { isActive: true } }),
            WebappPage.findAndCountAll({ where: { isActive: true } }),
            Lesson.findAndCountAll({ where: { isActive: true } }),
            Broker.findAndCountAll({ where: { isActive: true } }),
            BotUser.count(),
            Event.findAndCountAll({ where: { isActive: true } })
        ]);

        res.json({
            bot_messages: { total: botMessages.count, active: botMessages.count },
            webapp_pages: { total: webappPages.count, active: webappPages.count },
            lessons: { total: lessons.count, active: lessons.count, categories: 3 },
            brokers: { total: brokers.count, active: brokers.count },
            bot_users: { total: botUsers, active: Math.floor(botUsers * 0.6) },
            events: { total: events.count, active: events.count }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// ============= مسیرهای عمومی (بدون نیاز به احراز هویت) =============
// این مسیرها قبل از middleware قرار می‌گیرند و برای همه قابل دسترس هستند

/**
 * @route   GET /api/lessons
 * @desc    دریافت لیست تمام درس‌ها
 * @access  Public
 */
router.get('/lessons', async (req, res) => {
  try {
    const lessons = await Lesson.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });
    res.json({ success: true, data: lessons });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/brokers
 * @desc    دریافت لیست تمام بروکرها
 * @access  Public
 */
router.get('/brokers', async (req, res) => {
  try {
    const brokers = await Broker.findAll({
      where: { isActive: true }
    });
    res.json({ success: true, data: brokers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/events
 * @desc    دریافت لیست رویدادهای پیش‌رو
 * @access  Public
 */
router.get('/events', async (req, res) => {
  try {
    const events = await Event.findAll({
      where: { 
        isActive: true, 
        eventDate: { [Op.gte]: new Date() } 
      },
      order: [['eventDate', 'ASC']]
    });
    res.json({ success: true, data: events });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/bot/menus
 * @desc    دریافت ساختار منوهای ربات
 * @access  Public
 */
router.get('/bot/menus', async (req, res) => {
  try {
    const menus = await BotMenu.findAll({
      where: { isActive: true },
      order: [['parentId', 'ASC'], ['order', 'ASC']]
    });
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/user/register
 * @desc    ثبت‌نام کاربر جدید در ربات
 * @access  Public
 */
router.post('/user/register', async (req, res) => {
  try {
    const { telegramId, firstName, lastName, username, phone, nationalCode, email } = req.body;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'telegramId الزامی است' 
      });
    }
    
    const [user, created] = await BotUser.findOrCreate({
      where: { telegramId },
      defaults: { 
        firstName, 
        lastName, 
        username, 
        phone, 
        nationalCode, 
        email,
        lastInteraction: new Date()
      }
    });
    
    if (!created) {
      await user.update({
        firstName: firstName || user.firstName,
        lastName: lastName || user.lastName,
        username: username || user.username,
        phone: phone || user.phone,
        nationalCode: nationalCode || user.nationalCode,
        email: email || user.email,
        lastInteraction: new Date()
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        nationalCode: user.nationalCode,
        email: user.email,
        createdAt: user.createdAt
      },
      isNewUser: created 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   POST /api/contact
 * @desc    ارسال پیام تماس با ما
 * @access  Public
 */
router.post('/contact', async (req, res) => {
  try {
    const { name, email, message } = req.body;
    
    if (!name || !email || !message) {
      return res.status(400).json({ 
        success: false, 
        error: 'تمام فیلدها (name, email, message) الزامی هستند' 
      });
    }
    
    // اینجا می‌توانید پیام را در دیتابیس ذخیره کنید یا ایمیل بزنید
    console.log('📧 پیام جدید از فرم تماس:', { 
      name, 
      email, 
      message,
      time: new Date().toLocaleString('fa-IR')
    });
    
    // TODO: ذخیره در دیتابیس یا ارسال ایمیل
    
    res.json({ 
      success: true, 
      message: 'پیام شما با موفقیت دریافت شد. به زودی با شما تماس خواهیم گرفت.' 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= Middleware احراز هویت API =============
// تمام مسیرهای بعد از این نقطه نیاز به کلید API معتبر دارند

router.use(async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    const apiSecret = req.header('X-API-Secret');
    const startTime = Date.now();
    
    // بررسی وجود کلید و سکرت
    if (!apiKey || !apiSecret) {
      return res.status(401).json({ 
        success: false, 
        error: 'API Key and Secret are required. Please include X-API-Key and X-API-Secret headers.' 
      });
    }
    
    // جستجوی کلید در دیتابیس
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
      // ثبت لاگ ناموفق
      await ApiLog.create({
        endpoint: req.path,
        method: req.method,
        statusCode: 403,
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('User-Agent'),
        responseTime: Date.now() - startTime
      });
      
      return res.status(403).json({ 
        success: false, 
        error: 'Invalid or expired API key. Please check your credentials.' 
      });
    }
    
    // به‌روزرسانی آخرین استفاده
    await key.update({ lastUsed: new Date() });
    
    // ثبت لاگ موفق
    await ApiLog.create({
      apiKeyId: key.id,
      endpoint: req.path,
      method: req.method,
      statusCode: 200,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      responseTime: Date.now() - startTime
    });
    
    // افزودن اطلاعات کلید به req برای استفاده در ادامه
    req.apiKey = key;
    next();
    
  } catch (error) {
    console.error('❌ API Auth Error:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Internal server error during authentication' 
    });
  }
});

// ============= مسیرهای نیازمند احراز هویت =============

/**
 * @route   GET /api/lessons/:id
 * @desc    دریافت اطلاعات یک درس با شناسه
 * @access  Private (نیازمند کلید API)
 */
router.get('/lessons/:id', async (req, res) => {
  try {
    const lesson = await Lesson.findByPk(req.params.id);
    if (!lesson) {
      return res.status(404).json({ 
        success: false, 
        error: 'درس مورد نظر یافت نشد' 
      });
    }
    res.json({ success: true, data: lesson });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/brokers/:id
 * @desc    دریافت اطلاعات یک بروکر با شناسه
 * @access  Private (نیازمند کلید API)
 */
router.get('/brokers/:id', async (req, res) => {
  try {
    const broker = await Broker.findByPk(req.params.id);
    if (!broker) {
      return res.status(404).json({ 
        success: false, 
        error: 'بروکر مورد نظر یافت نشد' 
      });
    }
    res.json({ success: true, data: broker });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    دریافت اطلاعات یک رویداد با شناسه
 * @access  Private (نیازمند کلید API)
 */
router.get('/events/:id', async (req, res) => {
  try {
    const event = await Event.findByPk(req.params.id);
    if (!event) {
      return res.status(404).json({ 
        success: false, 
        error: 'رویداد مورد نظر یافت نشد' 
      });
    }
    res.json({ success: true, data: event });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/bot/status
 * @desc    بررسی وضعیت اتصال ربات تلگرام
 * @access  Private (نیازمند کلید API)
 */
router.get('/bot/status', async (req, res) => {
  try {
    const { checkBotStatus } = require('../services/telegramBot');
    const status = await checkBotStatus();
    res.json({ success: true, data: status });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/user/profile
 * @desc    دریافت اطلاعات پروفایل کاربر (با telegramId)
 * @access  Private (نیازمند کلید API)
 */
router.get('/user/profile', async (req, res) => {
  try {
    const { telegramId } = req.query;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'telegramId به عنوان پارامتر الزامی است' 
      });
    }
    
    const user = await BotUser.findOne({
      where: { telegramId }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'کاربر یافت نشد' 
      });
    }
    
    res.json({ 
      success: true, 
      data: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        username: user.username,
        phone: user.phone,
        nationalCode: user.nationalCode,
        email: user.email,
        createdAt: user.createdAt,
        lastInteraction: user.lastInteraction
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/user/messages
 * @desc    دریافت تاریخچه پیام‌های کاربر
 * @access  Private (نیازمند کلید API)
 */
router.get('/user/messages', async (req, res) => {
  try {
    const { telegramId, limit = 20 } = req.query;
    
    if (!telegramId) {
      return res.status(400).json({ 
        success: false, 
        error: 'telegramId به عنوان پارامتر الزامی است' 
      });
    }
    
    const user = await BotUser.findOne({
      where: { telegramId }
    });
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        error: 'کاربر یافت نشد' 
      });
    }
    
    const messages = await BotUserMessage.findAll({
      where: { userId: user.id },
      order: [['createdAt', 'DESC']],
      limit: parseInt(limit)
    });
    
    res.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/endpoints
 * @desc    دریافت لیست تمام اندپوینت‌های موجود
 * @access  Private (نیازمند کلید API)
 */
router.get('/endpoints', async (req, res) => {
  try {
    const endpoints = await ApiEndpoint.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name', 'ASC']]
    });
    res.json({ success: true, data: endpoints });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;