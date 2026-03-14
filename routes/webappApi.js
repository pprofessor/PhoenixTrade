// ============= routes/webappApi.js =============
const express = require('express');
const router = express.Router();
const { WebappPage } = require('../models');

// ============= دریافت محتوای صفحه اصلی =============
router.get('/home', async (req, res) => {
  try {
    const { lang = 'fa' } = req.query;
    console.log('✅ /api/webapp/home called with lang:', lang);
    
    // داده‌های تستی برای اطمینان از کار کردن API
    const testData = {
      hero: {
        title: { fa: 'تجربه‌ای نوین در معاملات (از API)' },
        subtitle: { fa: 'با ققنوس، به دنیای حرفه‌ای ترید قدم بگذارید' },
        btnPrimary: { fa: 'شروع کنید' },
        btnSecondary: { fa: 'بیشتر بدانید' }
      },
      textBlock1: {
        title: { fa: 'چرا ققنوس؟' },
        content: { fa: 'ققنوس با بیش از یک دهه تجربه در بازارهای مالی...' }
      },
      features: [
        { icon: 'fa-gem', title: { fa: 'تحلیل تکنیکال' }, description: { fa: 'ابزارهای پیشرفته تحلیل' } },
        { icon: 'fa-shield-alt', title: { fa: 'امنیت بالا' }, description: { fa: 'سرمایه شما در امنیت' } },
        { icon: 'fa-headset', title: { fa: 'پشتیبانی ۲۴/۷' }, description: { fa: 'پشتیبانی همیشه آماده' } }
      ]
    };
    
    res.json({ success: true, data: testData });
    
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;