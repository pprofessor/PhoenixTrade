const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// ============= Middleware =============
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============= فایل‌های استاتیک =============
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'public')));

// ============= Session Configuration =============
app.use(session({
  secret: process.env.SESSION_SECRET || 'phoenix-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// ============= View Engine =============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============= Database =============
const { syncDatabase, WebappSetting, WebappPage } = require('./models');

syncDatabase().then(() => {
  console.log('✅ Database synced For Running Telegram Bot');

  try {
    require('./services/telegramBot');
    console.log('🤖 Telegram bot started');
  } catch (botError) {
    console.error('❌ Bot startup error:', botError.message);
  }
}).catch(err => {
  console.error('❌ Database sync error:', err);
});

// ============= API صفحه اصلی =============
app.get('/api/webapp/home', async (req, res) => {
  try {
    const { lang = 'fa' } = req.query;
    console.log('✅ API /api/webapp/home called with lang:', lang);

    const settings = await WebappSetting.findAll();
    const settingsObj = {};
    settings.forEach(s => {
      settingsObj[s.key] = lang === 'en' ? s.value_en : lang === 'ar' ? s.value_ar : s.value_fa;
    });

    const homepage = await WebappPage.findOne({
      where: { isHomepage: true, isActive: true }
    });

    let pageContent = {};
    if (homepage) {
      if (lang === 'en' && homepage.content_en) {
        pageContent = JSON.parse(homepage.content_en);
      } else if (lang === 'ar' && homepage.content_ar) {
        pageContent = JSON.parse(homepage.content_ar);
      } else {
        pageContent = JSON.parse(homepage.content_fa || '{}');
      }
    }

    const responseData = {
      settings: settingsObj,
      page: {
        title: homepage ? (lang === 'en' ? homepage.title_en : lang === 'ar' ? homepage.title_ar : homepage.title_fa) : 'صفحه اصلی',
        content: pageContent
      },
      hero: pageContent.hero || {
        title: { fa: 'تجربه‌ای نوین در معاملات', en: 'A New Experience in Trading', ar: 'تجربة جديدة في التداول' },
        subtitle: { fa: 'با ققنوس، به دنیای حرفه‌ای ترید قدم بگذارید', en: 'Step into the professional trading world with Phoenix', ar: 'ادخل إلى عالم التداول الاحترافي مع العنقاء' }
      },
      features: pageContent.features || [
        { icon: 'fa-gem', title: { fa: 'تحلیل تکنیکال', en: 'Technical Analysis', ar: 'التحليل الفني' }, description: { fa: 'ابزارهای پیشرفته تحلیل', en: 'Advanced analysis tools', ar: 'أدوات تحليل متقدمة' } },
        { icon: 'fa-shield-alt', title: { fa: 'امنیت بالا', en: 'High Security', ar: 'أمان عالي' }, description: { fa: 'سرمایه شما در امنیت کامل', en: 'Your capital is completely safe', ar: 'رأس مالك آمن تماماً' } },
        { icon: 'fa-headset', title: { fa: 'پشتیبانی ۲۴/۷', en: '24/7 Support', ar: 'دعم على مدار الساعة' }, description: { fa: 'پشتیبانی همیشه آماده پاسخگویی', en: 'Support always ready to help', ar: 'الدعم دائماً جاهز للمساعدة' } }
      ]
    };

    res.json({ success: true, data: responseData });

  } catch (error) {
    console.error('❌ Error in /api/webapp/home:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= Routes =============
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes');

// *** ترتیب صحیح مسیرها - بسیار مهم ***
// 1. اول مسیرهای عمومی API (با /api)
app.use('/api', apiRoutes);  // اینجا apiRoutes را برای مسیرهای عمومی قرار می‌دهیم

// 2. بعد مسیرهای پنل مدیریت (با /pprofessor)
app.use('/pprofessor', authRoutes);
app.use('/pprofessor', adminRoutes);

// 3. بعد مسیرهای API پنل مدیریت (با /pprofessor/api) - اینها از middleware isAuthenticated استفاده می‌کنند
// توجه: این مسیر دیگر نیازی به تعریف جداگانه نیست چون apiRoutes قبلاً برای /api تعریف شده
// app.use('/pprofessor/api', apiRoutes); // این خط را حذف می‌کنیم

// صفحه اصلی سایت
app.get('/', async (req, res) => {
  try {
    const lang = req.query.lang || 'fa';
    console.log('🏠 Home page requested, lang:', lang);

    res.render('home', {
      title: 'خانه',
      lang: lang,
      user: null
    });
  } catch (error) {
    console.error('❌ Error loading home page:', error);
    res.status(500).send('خطا در بارگذاری صفحه اصلی');
  }
});

// ============= Error Handler =============
app.use((err, req, res, next) => {
  console.error('❌ Server error:', err.stack);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// ============= Start Server =============
app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login: http://localhost:${PORT}/pprofessor/login`);
  console.log(`📁 Uploads directory: ${path.join(__dirname, 'uploads')}`);
  console.log(`📁 Public directory: ${path.join(__dirname, 'public')}`);
});