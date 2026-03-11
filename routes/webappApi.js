// ============= routes/webappApi.js =============
// APIهای عمومی برای وب‌اپ (مصرف در فرانت‌اند)

const express = require('express');
const router = express.Router();
const { 
  WebappPage, WebappMenu, WebappMedia, 
  WebappForm, WebappFormEntry, WebappSetting 
} = require('../models');
const { Op } = require('sequelize');

// ============= دریافت صفحه بر اساس slug =============
router.get('/page/:slug', async (req, res) => {
  try {
    const { slug } = req.params;
    const { lang = 'fa' } = req.query;
    
    const page = await WebappPage.findOne({
      where: { slug, isActive: true }
    });
    
    if (!page) {
      return res.status(404).json({ 
        success: false, 
        error: 'صفحه یافت نشد' 
      });
    }
    
    // افزایش بازدید
    await page.increment('viewCount');
    
    // انتخاب محتوا بر اساس زبان
    let content = [];
    if (lang === 'en' && page.content_en) content = JSON.parse(page.content_en);
    else if (lang === 'ar' && page.content_ar) content = JSON.parse(page.content_ar);
    else content = JSON.parse(page.content_fa || '[]');
    
    res.json({
      success: true,
      data: {
        id: page.id,
        title: lang === 'en' ? page.title_en : lang === 'ar' ? page.title_ar : page.title_fa,
        slug: page.slug,
        content: content,
        meta_title: lang === 'en' ? page.meta_title_en : lang === 'ar' ? page.meta_title_ar : page.meta_title_fa,
        meta_description: lang === 'en' ? page.meta_description_en : lang === 'ar' ? page.meta_description_ar : page.meta_description_fa,
        isHomepage: page.isHomepage
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= دریافت صفحه اصلی =============
router.get('/home', async (req, res) => {
  try {
    const { lang = 'fa' } = req.query;
    
    const homepage = await WebappPage.findOne({
      where: { isHomepage: true, isActive: true }
    });
    
    if (!homepage) {
      return res.status(404).json({ 
        success: false, 
        error: 'صفحه اصلی تنظیم نشده است' 
      });
    }
    
    // افزایش بازدید
    await homepage.increment('viewCount');
    
    let content = [];
    if (lang === 'en' && homepage.content_en) content = JSON.parse(homepage.content_en);
    else if (lang === 'ar' && homepage.content_ar) content = JSON.parse(homepage.content_ar);
    else content = JSON.parse(homepage.content_fa || '[]');
    
    res.json({
      success: true,
      data: {
        id: homepage.id,
        title: lang === 'en' ? homepage.title_en : lang === 'ar' ? homepage.title_ar : homepage.title_fa,
        content: content,
        meta_title: lang === 'en' ? homepage.meta_title_en : lang === 'ar' ? homepage.meta_title_ar : homepage.meta_title_fa,
        meta_description: lang === 'en' ? homepage.meta_description_en : lang === 'ar' ? homepage.meta_description_ar : homepage.meta_description_fa
      }
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= دریافت منوها =============
router.get('/menu/:location', async (req, res) => {
  try {
    const { location } = req.params;
    const { lang = 'fa' } = req.query;
    
    const menus = await WebappMenu.findAll({
      where: { 
        location, 
        isActive: true,
        parentId: null 
      },
      include: [{
        model: WebappMenu,
        as: 'children',
        where: { isActive: true },
        required: false,
        include: [{
          model: WebappPage,
          as: 'page',
          attributes: ['slug']
        }]
      }, {
        model: WebappPage,
        as: 'page',
        attributes: ['slug']
      }],
      order: [['order', 'ASC']]
    });
    
    const formattedMenus = menus.map(menu => ({
      id: menu.id,
      title: lang === 'en' ? menu.name_en : lang === 'ar' ? menu.name_ar : menu.name_fa,
      url: menu.url || (menu.page ? `/${menu.page.slug}` : '#'),
      icon: menu.icon,
      target: menu.target,
      children: menu.children?.map(child => ({
        id: child.id,
        title: lang === 'en' ? child.name_en : lang === 'ar' ? child.name_ar : child.name_fa,
        url: child.url || (child.page ? `/${child.page.slug}` : '#'),
        icon: child.icon,
        target: child.target
      }))
    }));
    
    res.json({ success: true, data: formattedMenus });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= دریافت تنظیمات =============
router.get('/settings', async (req, res) => {
  try {
    const { lang = 'fa' } = req.query;
    
    const settings = await WebappSetting.findAll();
    
    const formattedSettings = {};
    settings.forEach(setting => {
      formattedSettings[setting.key] = lang === 'en' ? setting.value_en : 
                                       lang === 'ar' ? setting.value_ar : 
                                       setting.value_fa;
    });
    
    res.json({ success: true, data: formattedSettings });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= ارسال فرم =============
router.post('/form/:formId', async (req, res) => {
  try {
    const { formId } = req.params;
    const formData = req.body;
    
    const form = await WebappForm.findByPk(formId);
    if (!form) {
      return res.status(404).json({ 
        success: false, 
        error: 'فرم یافت نشد' 
      });
    }
    
    // ذخیره پاسخ
    const entry = await WebappFormEntry.create({
      formId,
      data: JSON.stringify(formData),
      ip: req.ip,
      userAgent: req.get('User-Agent')
    });
    
    // TODO: ارسال ایمیل به recipientEmail اگر تنظیم شده باشد
    
    res.json({ 
      success: true, 
      message: form.successMessage_fa || 'پیام شما با موفقیت ارسال شد' 
    });
    
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;