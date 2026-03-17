const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const botController = require('../controllers/botController');
const databaseController = require('../controllers/databaseController');
const apiController = require('../controllers/apiController');
const webappController = require('../controllers/webappController');
const {
  BotMenu,
  BotMessage,
  BotUser,
  BotUserMessage,
  WebappPage,
  Broker,
  EducationalContent,
  MarketIndex,
  BrokerFeature,
  BrokerFeatureValue,
  HomeSlide,
  SlideSettings
} = require('../models');
const { checkBotStatus } = require('../services/telegramBot');

// ============= تنظیمات آپلود فایل =============
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'media-' + uniqueSuffix + ext);
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx|svg/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('نوع فایل مجاز نیست. فقط: تصاویر، ویدئو، صدا، PDF و DOC'));
    }
  }
});

// ============= آپلود لوگوی بروکر =============
router.post('/api/upload/logo', isAuthenticated, upload.single('logo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'فایلی آپلود نشده' });
    }

    const logoUrl = '/uploads/' + req.file.filename;
    res.json({ success: true, url: logoUrl });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= مسیرهای اصلی مدیریت =============
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', {
    title: 'داشبورد مدیریت',
    user: req.session.adminUsername,
    activePage: 'dashboard'
  });
});

router.get('/backup', isAuthenticated, (req, res) => {
  res.render('backup', {
    title: 'مدیریت بکاپ',
    user: req.session.adminUsername,
    activePage: 'backup'
  });
});

// ============= مدیریت دیتابیس =============
router.get('/database', isAuthenticated, databaseController.databaseIndex);
router.post('/api/database/query', isAuthenticated, databaseController.executeQuery);
router.post('/api/database/search', isAuthenticated, databaseController.searchData);
router.post('/api/database/delete', isAuthenticated, databaseController.deleteRow);

// ============= مدیریت ربات =============
router.get('/bot', isAuthenticated, botController.botIndex);

// ============= API منوهای ربات =============
router.get('/api/bot/menus', isAuthenticated, botController.getMenus);
router.post('/api/bot/menus', isAuthenticated, upload.single('media'), async (req, res) => {
  try {
    console.log('📝 ایجاد منوی جدید با فایل:', req.file ? 'دارد' : 'ندارد');

    const menuData = {
      text: req.body.text,
      emoji: req.body.emoji || null,
      parentId: req.body.parentId || null,
      content: req.body.content || '',
      order: parseInt(req.body.order) || 0,
      isActive: true
    };

    if (req.file) {
      menuData.media_url = '/uploads/' + req.file.filename;
      menuData.media_type = req.file.mimetype.split('/')[0];
      console.log('📁 فایل آپلود شد:', menuData.media_url);
    }

    const menu = await BotMenu.create(menuData);

    const newMenu = await BotMenu.findByPk(menu.id, {
      include: [{ model: BotMenu, as: 'children' }]
    });

    res.status(201).json(newMenu);
  } catch (error) {
    console.error('❌ خطا در ایجاد منو:', error);
    res.status(500).json({ error: error.message });
  }
});

router.put('/api/bot/menus/:id', isAuthenticated, upload.single('media'), async (req, res) => {
  try {
    console.log('📝 ویرایش منو ID:', req.params.id, 'فایل:', req.file ? 'دارد' : 'ندارد');

    const menu = await BotMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'منو یافت نشد' });
    }

    const menuData = {
      text: req.body.text,
      emoji: req.body.emoji || null,
      parentId: req.body.parentId || null,
      content: req.body.content,
      order: parseInt(req.body.order) || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : menu.isActive
    };

    if (req.file) {
      menuData.media_url = '/uploads/' + req.file.filename;
      menuData.media_type = req.file.mimetype.split('/')[0];
      console.log('📁 فایل جدید آپلود شد:', menuData.media_url);
    }

    await menu.update(menuData);

    const updatedMenu = await BotMenu.findByPk(menu.id, {
      include: [{ model: BotMenu, as: 'children' }]
    });

    res.json(updatedMenu);
  } catch (error) {
    console.error('❌ خطا در ویرایش منو:', error);
    res.status(500).json({ error: error.message });
  }
});

router.delete('/api/bot/menus/:id', isAuthenticated, async (req, res) => {
  try {
    const menu = await BotMenu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ error: 'منو یافت نشد' });

    const children = await BotMenu.findAll({ where: { parentId: menu.id } });
    if (children.length > 0) {
      return res.status(400).json({ error: 'این منو زیرمنو دارد. ابتدا زیرمنوها را حذف کنید.' });
    }

    await menu.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= API پیام‌های ربات =============
router.get('/api/bot/messages', isAuthenticated, botController.getMessages);
router.put('/api/bot/messages/:id', isAuthenticated, botController.updateMessage);
router.post('/api/bot/messages', isAuthenticated, async (req, res) => {
  try {
    const { key, text } = req.body;
    const [message, created] = await BotMessage.findOrCreate({
      where: { key },
      defaults: { key, text }
    });
    if (!created) await message.update({ text });
    res.json({ success: true, message });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ============= API کاربران ربات =============
router.get('/api/bot/users', isAuthenticated, botController.getUsers);
router.get('/api/bot/users/:id/messages', isAuthenticated, botController.getUserMessages);

// ============= وضعیت ربات =============
router.get('/api/bot/status', isAuthenticated, botController.getBotStatus);

// ============= تنظیمات API =============
router.get('/api-settings', isAuthenticated, apiController.apiSettingsIndex);

// ============= API کلیدها =============
router.get('/api/keys', isAuthenticated, apiController.getApiKeys);
router.post('/api/keys', isAuthenticated, apiController.createApiKey);
router.put('/api/keys/:id', isAuthenticated, apiController.updateApiKey);
router.delete('/api/keys/:id', isAuthenticated, apiController.deleteApiKey);
router.post('/api/keys/:id/regenerate', isAuthenticated, apiController.regenerateSecret);

// ============= API اندپوینت‌ها =============
router.get('/api/endpoints', isAuthenticated, apiController.getEndpoints);
router.post('/api/endpoints', isAuthenticated, apiController.createEndpoint);
router.put('/api/endpoints/:id', isAuthenticated, apiController.updateEndpoint);
router.delete('/api/endpoints/:id', isAuthenticated, apiController.deleteEndpoint);

// ============= API لاگ‌ها و آمار =============
router.get('/api/logs', isAuthenticated, apiController.getLogs);
router.post('/api/logs/clear', isAuthenticated, apiController.clearLogs);
router.get('/api/stats', isAuthenticated, apiController.getStats);

// ============= مدیریت وب‌اپ =============
router.get('/webapp', isAuthenticated, webappController.webappIndex);

// ============= API صفحات وب‌اپ =============
router.get('/api/webapp/pages', isAuthenticated, webappController.getPages);
router.get('/api/webapp/pages/:id', isAuthenticated, webappController.getPageById);
router.post('/api/webapp/pages', isAuthenticated, webappController.createPage);
router.put('/api/webapp/pages/:id', isAuthenticated, webappController.updatePage);
router.delete('/api/webapp/pages/:id', isAuthenticated, webappController.deletePage);
router.patch('/api/webapp/pages/:id/toggle', isAuthenticated, webappController.togglePageStatus);

// ============= مدیریت فوتر =============
const footerController = require('../controllers/footerController');

// صفحه مدیریت فوتر
router.get('/footer', isAuthenticated, footerController.index);

// ذخیره تنظیمات فوتر
router.post('/footer/save', isAuthenticated, footerController.save);

// آپلود تصویر آوارد (از multer قبلی استفاده کن)
const awardStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/awards/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'award-' + uniqueSuffix + ext);
  }
});

const awardUpload = multer({
  storage: awardStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('فقط تصاویر مجاز هستند'));
    }
  }
});

router.post('/footer/upload-award', isAuthenticated, awardUpload.single('image'), footerController.uploadAwardImage);

router.post('/footer/upload-award', isAuthenticated, awardUpload.single('image'), footerController.uploadAwardImage);
// ============= API مدیا =============
router.get('/api/webapp/media', isAuthenticated, webappController.getMedia);
router.post('/api/webapp/media/upload', isAuthenticated, upload.single('file'), webappController.uploadMedia);
router.delete('/api/webapp/media/:id', isAuthenticated, webappController.deleteMedia);
router.put('/api/webapp/media/:id', isAuthenticated, webappController.updateMediaInfo);

// ============= API منوها =============
router.get('/api/webapp/menus', isAuthenticated, webappController.getMenus);
router.get('/api/webapp/menus/:id', isAuthenticated, webappController.getMenuItem);
router.post('/api/webapp/menus', isAuthenticated, webappController.createMenu);
router.put('/api/webapp/menus/:id', isAuthenticated, webappController.updateMenu);
router.delete('/api/webapp/menus/:id', isAuthenticated, webappController.deleteMenu);
router.post('/api/webapp/menus/reorder', isAuthenticated, webappController.reorderMenus);

// ============= API فرم‌ها =============
router.get('/api/webapp/forms', isAuthenticated, webappController.getForms);
router.get('/api/webapp/forms/:id', isAuthenticated, webappController.getForm);
router.post('/api/webapp/forms', isAuthenticated, webappController.createForm);
router.put('/api/webapp/forms/:id', isAuthenticated, webappController.updateForm);
router.delete('/api/webapp/forms/:id', isAuthenticated, webappController.deleteForm);
router.get('/api/webapp/forms/:id/entries', isAuthenticated, webappController.getFormEntries);
router.delete('/api/webapp/forms/:formId/entries/:entryId', isAuthenticated, webappController.deleteFormEntry);

// ============= API تنظیمات =============
router.get('/api/webapp/settings', isAuthenticated, webappController.getSettings);
router.post('/api/webapp/settings', isAuthenticated, webappController.updateSettings);
router.get('/api/webapp/settings/:key', isAuthenticated, webappController.getSettingByKey);

// ============= API المان‌ها =============
router.get('/api/webapp/elements', isAuthenticated, webappController.getElements);
router.post('/api/webapp/elements', isAuthenticated, webappController.createElement);
router.put('/api/webapp/elements/:id', isAuthenticated, webappController.updateElement);
router.delete('/api/webapp/elements/:id', isAuthenticated, webappController.deleteElement);

// ============= API کاربران وب‌اپ =============
router.get('/api/webapp/users', isAuthenticated, webappController.getUsers);
router.get('/api/webapp/users/:id', isAuthenticated, webappController.getUser);
router.patch('/api/webapp/users/:id/toggle', isAuthenticated, webappController.toggleUserStatus);

// ویرایشگر صفحه
router.get('/webapp/builder/:id', isAuthenticated, async (req, res) => {
  try {
    const { WebappPage } = require('../models');
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).send('صفحه یافت نشد');
    }
    res.render('webapp-builder', {
      pageId: page.id,
      pageTitle: page.title_fa,
      user: req.session.adminUsername
    });
  } catch (error) {
    console.error('❌ خطا در ویرایشگر صفحه:', error);
    res.status(500).send('خطا');
  }
});

// ============= مدیریت هدر =============
const headerController = require('../controllers/headerController');

// صفحه مدیریت هدر
router.get('/header', isAuthenticated, headerController.index);

// ذخیره تنظیمات هدر
router.post('/header/save', isAuthenticated, headerController.save);

// آپلود تصویر لوگو
const logoStorage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/logo/');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'logo-' + uniqueSuffix + ext);
  }
});

const logoUpload = multer({
  storage: logoStorage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|svg/;
    const ext = path.extname(file.originalname).toLowerCase().substring(1);
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('فقط تصاویر مجاز هستند'));
    }
  }
});

router.post('/header/upload-logo', isAuthenticated, logoUpload.single('image'), headerController.uploadLogo);

// ============= مدیریت بروکرها =============
router.get('/brokers', isAuthenticated, async (req, res) => {
  try {
    const brokers = await Broker.findAll({
      order: [['order', 'ASC']]
    });

    res.render('admin/brokers', {
      title: 'مدیریت بروکرها',
      user: req.session.adminUsername,
      activePage: 'brokers',
      brokers: brokers
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).send('خطا');
  }
});

// ============= API بروکرها =============
router.get('/api/brokers', isAuthenticated, async (req, res) => {
  try {
    const brokers = await Broker.findAll({
      order: [['order', 'ASC']]
    });
    res.json({ success: true, data: brokers });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= API ایجاد بروکر =============
router.post('/api/brokers', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Creating broker with data:', req.body);

    const brokerData = {
      name: req.body.name,
      slug: req.body.slug,
      display_name_fa: req.body.display_name_fa || '',
      display_name_en: req.body.display_name_en || '',
      display_name_ar: req.body.display_name_ar || '',
      description_fa: req.body.description_fa || '',
      description_en: req.body.description_en || '',
      description_ar: req.body.description_ar || '',
      logo: req.body.logo || '',
      foundedYear: req.body.foundedYear,
      usersCount: req.body.usersCount,
      rating: req.body.rating || 0,
      regulations: JSON.stringify(req.body.regulations || []),
      spread: req.body.spread,
      leverage: req.body.leverage,
      minDeposit: req.body.minDeposit,
      registerLink: req.body.registerLink,
      isActive: req.body.isActive,
      isFeatured: req.body.isFeatured,
      order: req.body.order || 0
    };

    const broker = await Broker.create(brokerData);
    console.log('✅ Broker created successfully:', broker.id);
    res.status(201).json({ success: true, data: broker });

  } catch (error) {
    console.error('❌ Error creating broker:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'slug';
      const value = error.errors?.[0]?.value || '';

      return res.status(400).json({
        success: false,
        error: `مقدار "${value}" برای فیلد "${field}" تکراری است. لطفاً یک مقدار یکتا وارد کنید.`
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ایجاد بروکر'
    });
  }
});

// ============= API ویرایش بروکر =============
router.put('/api/brokers/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Updating broker ID:', req.params.id, 'with data:', req.body);

    const broker = await Broker.findByPk(req.params.id);
    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }

    const updateData = {
      name: req.body.name,
      slug: req.body.slug,
      display_name_fa: req.body.display_name_fa || '',
      display_name_en: req.body.display_name_en || '',
      display_name_ar: req.body.display_name_ar || '',
      description_fa: req.body.description_fa || '',
      description_en: req.body.description_en || '',
      description_ar: req.body.description_ar || '',
      logo: req.body.logo || '',
      foundedYear: req.body.foundedYear,
      usersCount: req.body.usersCount,
      rating: req.body.rating,
      regulations: JSON.stringify(req.body.regulations || []),
      spread: req.body.spread,
      leverage: req.body.leverage,
      minDeposit: req.body.minDeposit,
      registerLink: req.body.registerLink,
      isActive: req.body.isActive,
      isFeatured: req.body.isFeatured,
      order: req.body.order
    };

    await broker.update(updateData);
    console.log('✅ Broker updated successfully');
    res.json({ success: true, data: broker });

  } catch (error) {
    console.error('❌ Error updating broker:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'slug';
      const value = error.errors?.[0]?.value || '';

      return res.status(400).json({
        success: false,
        error: `مقدار "${value}" برای فیلد "${field}" تکراری است. لطفاً یک مقدار یکتا وارد کنید.`
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ویرایش بروکر'
    });
  }
});

router.delete('/api/brokers/:id', isAuthenticated, async (req, res) => {
  try {
    const broker = await Broker.findByPk(req.params.id);
    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }

    await broker.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// دریافت اطلاعات یک بروکر برای ویرایش
router.get('/api/brokers/:id', isAuthenticated, async (req, res) => {
  try {
    const broker = await Broker.findByPk(req.params.id);
    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }
    res.json({ success: true, data: broker });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

// ============= مدیریت محتوای آموزشی =============
// صفحه لیست محتوای آموزشی
router.get('/education', isAuthenticated, async (req, res) => {
  try {
    const contents = await EducationalContent.findAll({
      order: [['category', 'ASC'], ['order', 'ASC']]
    });

    res.render('admin/education', {
      title: 'مدیریت محتوای آموزشی',
      user: req.session.adminUsername,
      activePage: 'education',
      contents: contents
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).send('خطا');
  }
});

// ============= API محتوای آموزشی =============
router.get('/api/education', isAuthenticated, async (req, res) => {
  try {
    const contents = await EducationalContent.findAll({
      order: [['category', 'ASC'], ['order', 'ASC']]
    });
    res.json({ success: true, data: contents });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api/education/:id', isAuthenticated, async (req, res) => {
  try {
    const content = await EducationalContent.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'محتوا یافت نشد' });
    }
    res.json({ success: true, data: content });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/education', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Creating educational content with data:', req.body);

    const contentData = {
      title_fa: req.body.title_fa,
      title_en: req.body.title_en,
      title_ar: req.body.title_ar,
      slug: req.body.slug,
      category: req.body.category,
      content_fa: req.body.content_fa || '',
      content_en: req.body.content_en || '',
      content_ar: req.body.content_ar || '',
      excerpt_fa: req.body.excerpt_fa || '',
      excerpt_en: req.body.excerpt_en || '',
      excerpt_ar: req.body.excerpt_ar || '',
      featuredImage: req.body.featuredImage || '',
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const content = await EducationalContent.create(contentData);
    console.log('✅ Educational content created successfully:', content.id);
    res.status(201).json({ success: true, data: content });

  } catch (error) {
    console.error('❌ Error creating educational content:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'slug';
      const value = error.errors?.[0]?.value || '';

      return res.status(400).json({
        success: false,
        error: `مقدار "${value}" برای فیلد "${field}" تکراری است. لطفاً یک مقدار یکتا وارد کنید.`
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ایجاد محتوا'
    });
  }
});

router.put('/api/education/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Updating educational content ID:', req.params.id, 'with data:', req.body);

    const content = await EducationalContent.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'محتوا یافت نشد' });
    }

    const updateData = {
      title_fa: req.body.title_fa,
      title_en: req.body.title_en,
      title_ar: req.body.title_ar,
      slug: req.body.slug,
      category: req.body.category,
      content_fa: req.body.content_fa || '',
      content_en: req.body.content_en || '',
      content_ar: req.body.content_ar || '',
      excerpt_fa: req.body.excerpt_fa || '',
      excerpt_en: req.body.excerpt_en || '',
      excerpt_ar: req.body.excerpt_ar || '',
      featuredImage: req.body.featuredImage || '',
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    await content.update(updateData);
    console.log('✅ Educational content updated successfully');
    res.json({ success: true, data: content });

  } catch (error) {
    console.error('❌ Error updating educational content:', error);

    if (error.name === 'SequelizeUniqueConstraintError') {
      const field = error.errors?.[0]?.path || 'slug';
      const value = error.errors?.[0]?.value || '';

      return res.status(400).json({
        success: false,
        error: `مقدار "${value}" برای فیلد "${field}" تکراری است. لطفاً یک مقدار یکتا وارد کنید.`
      });
    }

    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ویرایش محتوا'
    });
  }
});

router.delete('/api/education/:id', isAuthenticated, async (req, res) => {
  try {
    const content = await EducationalContent.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'محتوا یافت نشد' });
    }

    await content.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/api/education/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const content = await EducationalContent.findByPk(req.params.id);
    if (!content) {
      return res.status(404).json({ success: false, error: 'محتوا یافت نشد' });
    }

    content.isActive = !content.isActive;
    await content.save();
    res.json({ success: true, isActive: content.isActive });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= API مقادیر ویژگی‌های بروکر =============
router.get('/api/brokers/:brokerId/features', isAuthenticated, async (req, res) => {
  try {
    const values = await BrokerFeatureValue.findAll({
      where: { brokerId: req.params.brokerId },
      include: [{ model: BrokerFeature, as: 'feature' }]
    });

    res.json({ success: true, data: values });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/brokers/:brokerId/features', isAuthenticated, async (req, res) => {
  try {
    const { brokerId } = req.params;
    const { features } = req.body;

    await BrokerFeatureValue.destroy({ where: { brokerId } });

    const values = await Promise.all(
      features.map(f => BrokerFeatureValue.create({
        brokerId,
        featureId: f.featureId,
        value: f.value
      }))
    );

    res.json({ success: true, data: values });

  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= مدیریت اسلایدهای صفحه اصلی =============
router.get('/home-slides', isAuthenticated, async (req, res) => {
  try {
    const slides = await HomeSlide.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });

    res.render('admin/home-slides', {
      title: 'مدیریت اسلایدهای صفحه اصلی',
      user: req.session.adminUsername,
      activePage: 'home-slides',
      slides: slides
    });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).send('خطا');
  }
});

// ============= API اسلایدها =============
router.get('/api/home-slides', isAuthenticated, async (req, res) => {
  try {
    const slides = await HomeSlide.findAll({
      order: [['order', 'ASC'], ['createdAt', 'DESC']]
    });
    res.json({ success: true, data: slides });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

router.get('/api/home-slides/:id', isAuthenticated, async (req, res) => {
  try {
    const slide = await HomeSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, error: 'اسلاید یافت نشد' });
    }
    res.json({ success: true, data: slide });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.post('/api/home-slides', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Creating home slide with data:', req.body);

    const slideData = {
      image: req.body.image,
      title_fa: req.body.title_fa,
      title_en: req.body.title_en,
      title_ar: req.body.title_ar,
      subtitle_fa: req.body.subtitle_fa,
      subtitle_en: req.body.subtitle_en,
      subtitle_ar: req.body.subtitle_ar,
      button_fa: req.body.button_fa,
      button_en: req.body.button_en,
      button_ar: req.body.button_ar,
      button_link: req.body.button_link,
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const slide = await HomeSlide.create(slideData);
    console.log('✅ Home slide created successfully:', slide.id);
    res.status(201).json({ success: true, data: slide });

  } catch (error) {
    console.error('❌ Error creating home slide:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ایجاد اسلاید'
    });
  }
});

router.put('/api/home-slides/:id', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Updating home slide ID:', req.params.id, 'with data:', req.body);

    const slide = await HomeSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, error: 'اسلاید یافت نشد' });
    }

    const updateData = {
      image: req.body.image,
      title_fa: req.body.title_fa,
      title_en: req.body.title_en,
      title_ar: req.body.title_ar,
      subtitle_fa: req.body.subtitle_fa,
      subtitle_en: req.body.subtitle_en,
      subtitle_ar: req.body.subtitle_ar,
      button_fa: req.body.button_fa,
      button_en: req.body.button_en,
      button_ar: req.body.button_ar,
      button_link: req.body.button_link,
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    await slide.update(updateData);
    console.log('✅ Home slide updated successfully');
    res.json({ success: true, data: slide });

  } catch (error) {
    console.error('❌ Error updating home slide:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ویرایش اسلاید'
    });
  }
});

router.delete('/api/home-slides/:id', isAuthenticated, async (req, res) => {
  try {
    const slide = await HomeSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, error: 'اسلاید یافت نشد' });
    }

    await slide.destroy();
    res.json({ success: true });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.patch('/api/home-slides/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const slide = await HomeSlide.findByPk(req.params.id);
    if (!slide) {
      return res.status(404).json({ success: false, error: 'اسلاید یافت نشد' });
    }

    slide.isActive = !slide.isActive;
    await slide.save();
    res.json({ success: true, isActive: slide.isActive });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});


// ============= API ذخیره تنظیمات اسلایدشو =============
router.post('/api/slide-settings', isAuthenticated, async (req, res) => {
  try {
    console.log('📝 Saving slide settings with data:', req.body);

    let settings = await SlideSettings.findOne();

    if (!settings) {
      settings = await SlideSettings.create({
        slideDuration: req.body.slideDuration || 5000,
        autoPlay: req.body.autoPlay === 'true',
        showArrows: req.body.showArrows === 'true',
        showDots: req.body.showDots === 'true'
      });
    } else {
      await settings.update({
        slideDuration: req.body.slideDuration || 5000,
        autoPlay: req.body.autoPlay === 'true',
        showArrows: req.body.showArrows === 'true',
        showDots: req.body.showDots === 'true'
      });
    }

    console.log('✅ Slide settings saved successfully');
    res.json({ success: true, data: settings });

  } catch (error) {
    console.error('❌ Error saving slide settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در ذخیره تنظیمات'
    });
  }
});

// ============= دریافت تنظیمات اسلایدشو =============
router.get('/api/slide-settings', isAuthenticated, async (req, res) => {
  try {
    let settings = await SlideSettings.findOne();

    if (!settings) {
      settings = await SlideSettings.create({
        slideDuration: 5000,
        autoPlay: true,
        showArrows: true,
        showDots: true
      });
    }

    res.json({ success: true, data: settings });

  } catch (error) {
    console.error('❌ Error fetching slide settings:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'خطا در دریافت تنظیمات'
    });
  }
});



module.exports = router;