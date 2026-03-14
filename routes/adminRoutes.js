const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const botController = require('../controllers/botController');
const databaseController = require('../controllers/databaseController');
const apiController = require('../controllers/apiController');
const webappController = require('../controllers/webappController');
const { BotMenu, BotMessage, BotUser, BotUserMessage, WebappPage, Broker } = require('../models');
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
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx/;
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
// صفحه اصلی مدیریت وب‌اپ
router.get('/webapp', isAuthenticated, webappController.webappIndex);

// ============= API صفحات وب‌اپ =============
router.get('/api/webapp/pages', isAuthenticated, webappController.getPages);
router.get('/api/webapp/pages/:id', isAuthenticated, webappController.getPageById);
router.post('/api/webapp/pages', isAuthenticated, webappController.createPage);
router.put('/api/webapp/pages/:id', isAuthenticated, webappController.updatePage);
router.delete('/api/webapp/pages/:id', isAuthenticated, webappController.deletePage);
router.patch('/api/webapp/pages/:id/toggle', isAuthenticated, webappController.togglePageStatus);

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

router.post('/api/brokers', isAuthenticated, async (req, res) => {
  try {
    const brokerData = {
      name: req.body.name,
      slug: req.body.slug,
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
    res.status(201).json({ success: true, data: broker });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
});

router.put('/api/brokers/:id', isAuthenticated, async (req, res) => {
  try {
    const broker = await Broker.findByPk(req.params.id);
    if (!broker) {
      return res.status(404).json({ success: false, error: 'بروکر یافت نشد' });
    }

    const updateData = {
      name: req.body.name,
      slug: req.body.slug,
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
    res.json({ success: true, data: broker });
  } catch (error) {
    console.error('❌ Error:', error);
    res.status(500).json({ success: false, error: error.message });
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

// ============= دریافت اطلاعات یک بروکر برای ویرایش =============
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

module.exports = router;