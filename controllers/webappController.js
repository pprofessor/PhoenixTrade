// ============= controllers/webappController.js =============
// کنترلر مدیریت وب‌اپ (صفحات، منوها، مدیا، فرم‌ها)

const { 
  WebappPage, WebappMenu, WebappElement, WebappMedia, 
  WebappForm, WebappFormEntry, WebappUser, WebappSetting,
  Admin  // برای ارتباط با آپلودکننده
} = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// ============= صفحه اصلی مدیریت وب‌اپ =============
const webappIndex = async (req, res) => {
  try {
    // آمار کلی - بررسی وجود مدل‌ها قبل از استفاده
    const pages = WebappPage ? await WebappPage.count() : 0;
    const menus = WebappMenu ? await WebappMenu.count({ where: { isActive: true } }) : 0;
    const media = WebappMedia ? await WebappMedia.count() : 0;
    const forms = WebappForm ? await WebappForm.count() : 0;
    const users = WebappUser ? await WebappUser.count() : 0;

    res.render('webapp', {
      title: 'مدیریت وب‌اپ',
      user: req.session.adminUsername,
      activePage: 'webapp',
      stats: { pages, menus, media, forms, users }
    });
  } catch (error) {
    console.error('❌ Webapp index error:', error);
    res.status(500).render('error', {
      title: 'خطا',
      message: 'خطا در بارگذاری صفحه مدیریت وب‌اپ',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.session.adminUsername
    });
  }
};

// ============= مدیریت صفحات =============
const getPages = async (req, res) => {
  try {
    if (!WebappPage) {
      return res.status(500).json({ success: false, error: 'مدل WebappPage تعریف نشده است' });
    }
    const pages = await WebappPage.findAll({
      order: [['isHomepage', 'DESC'], ['order', 'ASC']]
    });
    res.json({ success: true, data: pages });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createPage = async (req, res) => {
  try {
    if (!WebappPage) {
      return res.status(500).json({ success: false, error: 'مدل WebappPage تعریف نشده است' });
    }
    const page = await WebappPage.create(req.body);
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updatePage = async (req, res) => {
  try {
    if (!WebappPage) {
      return res.status(500).json({ success: false, error: 'مدل WebappPage تعریف نشده است' });
    }
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }
    await page.update(req.body);
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deletePage = async (req, res) => {
  try {
    if (!WebappPage) {
      return res.status(500).json({ success: false, error: 'مدل WebappPage تعریف نشده است' });
    }
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }
    await page.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= کتابخانه مدیا =============
const getMedia = async (req, res) => {
  try {
    if (!WebappMedia) {
      return res.status(500).json({ success: false, error: 'مدل WebappMedia تعریف نشده است' });
    }
    const media = await WebappMedia.findAll({
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const uploadMedia = async (req, res) => {
  try {
    if (!WebappMedia) {
      return res.status(500).json({ success: false, error: 'مدل WebappMedia تعریف نشده است' });
    }
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'فایلی آپلود نشده است' });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;
    
    // تشخیص نوع فایل
    let type = 'other';
    if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.startsWith('video/')) type = 'video';
    else if (file.mimetype.startsWith('audio/')) type = 'audio';
    else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) type = 'document';

    const media = await WebappMedia.create({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: fileUrl,
      type: type,
      mimeType: file.mimetype,
      size: file.size,
      uploadedBy: req.session.adminId || null
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteMedia = async (req, res) => {
  try {
    if (!WebappMedia) {
      return res.status(500).json({ success: false, error: 'مدل WebappMedia تعریف نشده است' });
    }
    const media = await WebappMedia.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, error: 'فایل یافت نشد' });
    }

    // حذف فایل از دیسک
    const filePath = path.join(__dirname, '..', media.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await media.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت منوها =============
const getMenus = async (req, res) => {
  try {
    if (!WebappMenu) {
      return res.status(500).json({ success: false, error: 'مدل WebappMenu تعریف نشده است' });
    }
    const menus = await WebappMenu.findAll({
      include: [{ model: WebappPage, as: 'page', attributes: ['id', 'title_fa', 'slug'] }],
      order: [['location', 'ASC'], ['order', 'ASC']]
    });
    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createMenu = async (req, res) => {
  try {
    if (!WebappMenu) {
      return res.status(500).json({ success: false, error: 'مدل WebappMenu تعریف نشده است' });
    }
    const menu = await WebappMenu.create(req.body);
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateMenu = async (req, res) => {
  try {
    if (!WebappMenu) {
      return res.status(500).json({ success: false, error: 'مدل WebappMenu تعریف نشده است' });
    }
    const menu = await WebappMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'آیتم منو یافت نشد' });
    }
    await menu.update(req.body);
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteMenu = async (req, res) => {
  try {
    if (!WebappMenu) {
      return res.status(500).json({ success: false, error: 'مدل WebappMenu تعریف نشده است' });
    }
    const menu = await WebappMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'آیتم منو یافت نشد' });
    }
    await menu.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت فرم‌ها =============
const getForms = async (req, res) => {
  try {
    if (!WebappForm) {
      return res.status(500).json({ success: false, error: 'مدل WebappForm تعریف نشده است' });
    }
    const forms = await WebappForm.findAll({
      include: [{ model: WebappFormEntry, as: 'entries', limit: 5, order: [['createdAt', 'DESC']] }]
    });
    res.json({ success: true, data: forms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const createForm = async (req, res) => {
  try {
    if (!WebappForm) {
      return res.status(500).json({ success: false, error: 'مدل WebappForm تعریف نشده است' });
    }
    const form = await WebappForm.create(req.body);
    res.status(201).json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const getFormEntries = async (req, res) => {
  try {
    if (!WebappFormEntry) {
      return res.status(500).json({ success: false, error: 'مدل WebappFormEntry تعریف نشده است' });
    }
    const entries = await WebappFormEntry.findAll({
      where: { formId: req.params.id },
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: entries });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت تنظیمات =============
const getSettings = async (req, res) => {
  try {
    if (!WebappSetting) {
      return res.status(500).json({ success: false, error: 'مدل WebappSetting تعریف نشده است' });
    }
    const settings = await WebappSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

const updateSettings = async (req, res) => {
  try {
    if (!WebappSetting) {
      return res.status(500).json({ success: false, error: 'مدل WebappSetting تعریف نشده است' });
    }
    const { settings } = req.body;
    
    for (const item of settings) {
      await WebappSetting.upsert({
        key: item.key,
        value_fa: item.value_fa,
        value_en: item.value_en,
        value_ar: item.value_ar,
        type: item.type,
        category: item.category
      });
    }
    
    res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  webappIndex,
  getPages, createPage, updatePage, deletePage,
  getMedia, uploadMedia, deleteMedia,
  getMenus, createMenu, updateMenu, deleteMenu,
  getForms, createForm, getFormEntries,
  getSettings, updateSettings
};