// ============= routes/authRoutes.js =============
const express = require('express');
const router = express.Router();
const { Admin } = require('../models');

// ============= صفحه لاگین =============
router.get('/login', (req, res) => {
  // اگر قبلاً لاگین کرده، مستقیم برو به داشبورد
  if (req.session && req.session.adminId) {
    return res.redirect('/pprofessor/dashboard');
  }
  
  res.render('login', { 
    title: 'ورود',
    error: null 
  });
});

// ============= پردازش فرم لاگین =============
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    // اعتبارسنجی ورودی
    if (!username || !password) {
      return res.render('login', { 
        title: 'ورود',
        error: 'نام کاربری و رمز عبور را وارد کنید' 
      });
    }
    
    const admin = await Admin.findOne({ where: { username } });
    
    if (!admin || !(await admin.validatePassword(password))) {
      return res.render('login', { 
        title: 'ورود',
        error: 'نام کاربری یا رمز عبور اشتباه است' 
      });
    }
    
    // ست کردن session
    req.session.adminId = admin.id;
    req.session.adminUsername = admin.username;
    req.session.adminRole = admin.role;
    
    // به‌روزرسانی آخرین ورود
    await admin.update({ lastLogin: new Date() });
    
    console.log('✅ Login successful for:', username);
    
    res.redirect('/pprofessor/dashboard');
  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).render('login', { 
      title: 'ورود',
      error: 'خطای سرور، لطفاً دوباره تلاش کنید' 
    });
  }
});

// ============= خروج =============
router.get('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('❌ Logout error:', err);
    }
    res.redirect('/pprofessor/login');
  });
});

module.exports = router;