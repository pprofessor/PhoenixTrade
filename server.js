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
    secure: process.env.NODE_ENV === 'production',
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// ============= View Engine =============
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ============= Database =============
const { syncDatabase } = require('./models');

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

// ============= Routes =============
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const apiRoutes = require('./routes/apiRoutes'); // مسیرهای API پنل
const apiPublicRoutes = require('./routes/apiRoutes'); // مسیرهای عمومی API

// مسیرهای عمومی API (بدون نیاز به احراز هویت پنل)
app.use('/api', apiPublicRoutes);

// مسیرهای API پنل مدیریت (با احراز هویت)
app.use('/pprofessor/api', apiRoutes);

// مسیرهای پنل مدیریت
app.use('/pprofessor', authRoutes);
app.use('/pprofessor', adminRoutes);

// صفحه اصلی
app.get('/', (req, res) => {
  res.send('PhoenixTrade API is running');
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