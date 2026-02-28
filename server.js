const express = require('express');
const session = require('express-session');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
app.use(session({
  secret: 'phoenix-secret-key-2026',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: false, // برای لوکال false باشه
    maxAge: 1000 * 60 * 60 * 24 * 7 // 1 هفته
  }
}));

// تنظیم EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// دیتابیس
const { syncDatabase } = require('./models');
syncDatabase().then(() => {
    console.log('✅ syncDatabase completed');
    // راه‌اندازی ربات بعد از sync
    if (process.env.NODE_ENV !== 'production') {
        require('./services/telegramBot');
    }
});

// راه‌اندازی ربات تلگرام (فقط در محیط لوکال)
if (process.env.NODE_ENV !== 'production') {
    require('./services/telegramBot');
}

// مسیرهای پنل مدیریت
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
app.use('/pprofessor', authRoutes);
app.use('/pprofessor', adminRoutes);

// صفحه اصلی (اختیاری)
app.get('/', (req, res) => {
  res.send('PhoenixTrade API is running');
});

// مدیریت خطا
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

app.listen(PORT, () => {
  console.log(`✅ Server running on http://localhost:${PORT}`);
  console.log(`🔐 Login page: http://localhost:${PORT}/pprofessor/login`);
});