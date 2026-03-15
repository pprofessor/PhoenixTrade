const express = require('express');
const router = express.Router();
const { Op } = require('sequelize');
const {
  BotMessage, WebappPage, Lesson, Broker, BotUser, Event,
  BotMenu, ApiKey, ApiLog, ApiEndpoint, BotUserMessage,
  EducationalContent, MarketIndex, HomeSlide,
  BrokerFeature, BrokerFeatureValue
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
// این مسیرها قبل از middleware قرار می‌گیرند

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
 * @desc    دریافت لیست بروکرها
 * @access  Public
 */
router.get('/brokers', async (req, res) => {
  try {
    const { limit = 10, featured } = req.query;

    const where = { isActive: true };
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const brokers = await Broker.findAll({
      where,
      order: [['order', 'ASC'], ['rating', 'DESC']],
      limit: parseInt(limit)
    });

    res.json({ success: true, data: brokers });
  } catch (error) {
    console.error('❌ Error fetching brokers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/broker-features
 * @desc    دریافت لیست همه ویژگی‌ها
 * @access  Public
 */
router.get('/broker-features', async (req, res) => {
  try {
    const features = await BrokerFeature.findAll({
      where: { showInComparison: true },
      order: [['category', 'ASC'], ['displayOrder', 'ASC']]
    });

    res.json({ success: true, data: features });
  } catch (error) {
    console.error('❌ Error fetching broker features:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/brokers/:slug/features
 * @desc    دریافت ویژگی‌های یک بروکر
 * @access  Public
 */
router.get('/brokers/:slug/features', async (req, res) => {
  try {
    const broker = await Broker.findOne({
      where: { slug: req.params.slug, isActive: true }
    });

    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }

    const featureValues = await BrokerFeatureValue.findAll({
      where: { brokerId: broker.id },
      include: [{ model: BrokerFeature, as: 'feature' }]
    });

    const formattedFeatures = featureValues.map(fv => ({
      key: fv.feature.key,
      title: {
        fa: fv.feature.title_fa,
        en: fv.feature.title_en,
        ar: fv.feature.title_ar
      },
      value: fv.value,
      dataType: fv.feature.dataType,
      unit: fv.feature.unit,
      category: fv.feature.category
    }));

    res.json({
      success: true,
      data: {
        broker: {
          id: broker.id,
          name: broker.name,
          display_name: {
            fa: broker.display_name_fa,
            en: broker.display_name_en,
            ar: broker.display_name_ar
          },
          logo: broker.logo,
          rating: broker.rating
        },
        features: formattedFeatures
      }
    });
  } catch (error) {
    console.error('❌ Error fetching broker features:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/brokers/compare
 * @desc    مقایسه چند بروکر
 * @access  Public
 */
router.get('/brokers/compare', async (req, res) => {
  try {
    const { ids } = req.query; // آرایه‌ای از idها
    const brokerIds = ids.split(',').map(id => parseInt(id));

    const brokers = await Broker.findAll({
      where: { id: brokerIds, isActive: true }
    });

    const features = await BrokerFeature.findAll({
      where: { showInComparison: true },
      order: [['category', 'ASC'], ['displayOrder', 'ASC']]
    });

    const featureValues = await BrokerFeatureValue.findAll({
      where: { brokerId: brokerIds }
    });

    // ساختاردهی داده‌ها برای مقایسه
    const comparisonData = {
      brokers: brokers.map(b => ({
        id: b.id,
        name: b.name,
        display_name: {
          fa: b.display_name_fa,
          en: b.display_name_en,
          ar: b.display_name_ar
        },
        logo: b.logo,
        rating: b.rating
      })),
      features: features.map(f => ({
        id: f.id,
        key: f.key,
        title: {
          fa: f.title_fa,
          en: f.title_en,
          ar: f.title_ar
        },
        dataType: f.dataType,
        unit: f.unit,
        category: f.category
      })),
      values: featureValues.map(v => ({
        brokerId: v.brokerId,
        featureId: v.featureId,
        value: v.value
      }))
    };

    res.json({ success: true, data: comparisonData });
  } catch (error) {
    console.error('❌ Error comparing brokers:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/education
 * @desc    دریافت لیست محتوای آموزشی با قابلیت صفحه‌بندی و فیلتر
 * @access  Public
 */
router.get('/education', async (req, res) => {
  try {
    const { category, limit = 9, page = 1 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    const where = { isActive: true };
    if (category && category !== 'all') {
      where.category = category;
    }

    const { count, rows } = await EducationalContent.findAndCountAll({
      where,
      order: [['order', 'ASC'], ['createdAt', 'DESC']],
      limit: parseInt(limit),
      offset: parseInt(offset)
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        totalPages: Math.ceil(count / parseInt(limit))
      }
    });
  } catch (error) {
    console.error('❌ Error fetching educational content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/market-indices
 * @desc    دریافت لیست شاخص‌های بازار
 * @access  Public
 */
router.get('/market-indices', async (req, res) => {
  try {
    const { type, featured, limit = 20 } = req.query;

    const where = { isActive: true };
    if (type) {
      where.type = type;
    }
    if (featured === 'true') {
      where.isFeatured = true;
    }

    const indices = await MarketIndex.findAll({
      where,
      order: [['type', 'ASC'], ['order', 'ASC']],
      limit: parseInt(limit)
    });

    const formattedIndices = indices.map(index => ({
      id: index.id,
      symbol: index.symbol,
      name_fa: index.name_fa,
      name_en: index.name_en,
      name_ar: index.name_ar,
      type: index.type,
      price: index.price,
      previousPrice: index.previousPrice,
      change: index.change,
      tradingViewUrl: index.tradingViewUrl,
      image: index.image,
      isFeatured: index.isFeatured
    }));

    res.json({ success: true, data: formattedIndices });
  } catch (error) {
    console.error('❌ Error fetching market indices:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/market-indices/:symbol
 * @desc    دریافت اطلاعات یک شاخص با نماد
 * @access  Public
 */
router.get('/market-indices/:symbol', async (req, res) => {
  try {
    const index = await MarketIndex.findOne({
      where: { symbol: req.params.symbol, isActive: true }
    });

    if (!index) {
      return res.status(404).json({
        success: false,
        error: 'شاخص مورد نظر یافت نشد'
      });
    }

    res.json({
      success: true,
      data: {
        id: index.id,
        symbol: index.symbol,
        name: {
          fa: index.name_fa,
          en: index.name_en,
          ar: index.name_ar
        },
        type: index.type,
        price: index.price,
        previousPrice: index.previousPrice,
        change: index.change,
        tradingViewUrl: index.tradingViewUrl,
        isFeatured: index.isFeatured
      }
    });
  } catch (error) {
    console.error('❌ Error fetching market index:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/webapp/slides
 * @desc    دریافت لیست اسلایدهای صفحه اصلی
 * @access  Public
 */
router.get('/webapp/slides', async (req, res) => {
  try {
    const slides = await HomeSlide.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    const formattedSlides = slides.map(slide => ({
      id: slide.id,
      image: slide.image,
      title: {
        fa: slide.title_fa,
        en: slide.title_en,
        ar: slide.title_ar
      },
      subtitle: {
        fa: slide.subtitle_fa,
        en: slide.subtitle_en,
        ar: slide.subtitle_ar
      },
      button: {
        fa: slide.button_fa,
        en: slide.button_en,
        ar: slide.button_ar
      },
      link: slide.button_link,
      order: slide.order
    }));

    res.json({ success: true, data: formattedSlides });
  } catch (error) {
    console.error('❌ Error fetching slides:', error);
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

    console.log('📧 پیام جدید از فرم تماس:', {
      name,
      email,
      message,
      time: new Date().toLocaleString('fa-IR')
    });

    res.json({
      success: true,
      message: 'پیام شما با موفقیت دریافت شد. به زودی با شما تماس خواهیم گرفت.'
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= مسیرهای عمومی با پارامتر (نیازمند احراز هویت نیستند) =============
// این مسیرها باید قبل از middleware باشند

/**
 * @route   GET /api/lessons/:id
 * @desc    دریافت اطلاعات یک درس با شناسه
 * @access  Public
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
 * @route   GET /api/brokers/:slug
 * @desc    دریافت اطلاعات یک بروکر با slug
 * @access  Public
 */
router.get('/brokers/:slug', async (req, res) => {
  try {
    const broker = await Broker.findOne({
      where: { slug: req.params.slug, isActive: true }
    });

    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }

    res.json({ success: true, data: broker });
  } catch (error) {
    console.error('❌ Error fetching broker:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/education/:slug
 * @desc    دریافت اطلاعات یک محتوای آموزشی با slug
 * @access  Public
 */
router.get('/education/:slug', async (req, res) => {
  try {
    const content = await EducationalContent.findOne({
      where: { slug: req.params.slug, isActive: true }
    });

    if (!content) {
      return res.status(404).json({
        success: false,
        error: 'محتوای آموزشی مورد نظر یافت نشد'
      });
    }

    // افزایش بازدید
    await content.increment('viewCount');

    res.json({ success: true, data: content });
  } catch (error) {
    console.error('❌ Error fetching educational content:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @route   GET /api/events/:id
 * @desc    دریافت اطلاعات یک رویداد با شناسه
 * @access  Public
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

// ============= Middleware احراز هویت API =============
// تمام مسیرهای بعد از این نقطه نیاز به کلید API معتبر دارند

router.use(async (req, res, next) => {
  try {
    const apiKey = req.header('X-API-Key');
    const apiSecret = req.header('X-API-Secret');
    const startTime = Date.now();

    if (!apiKey || !apiSecret) {
      return res.status(401).json({
        success: false,
        error: 'API Key and Secret are required. Please include X-API-Key and X-API-Secret headers.'
      });
    }

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

    await key.update({ lastUsed: new Date() });

    await ApiLog.create({
      apiKeyId: key.id,
      endpoint: req.path,
      method: req.method,
      statusCode: 200,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      responseTime: Date.now() - startTime
    });

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