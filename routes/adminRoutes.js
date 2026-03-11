const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { isAuthenticated } = require('../middleware/auth');
const botController = require('../controllers/botController');
const databaseController = require('../controllers/databaseController');
const apiController = require('../controllers/apiController'); // اضافه شد
const { BotMenu, BotMessage, BotUser, BotUserMessage } = require('../models');
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

// ============= API منوها =============
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

// ============= API پیام‌ها =============
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

// ============= API کاربران =============
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

// ============= مدیریت وب اپ =============
router.get('/webapp', isAuthenticated, (req, res) => {
  res.render('webapp/index', { 
    title: 'مدیریت وب اپ',
    user: req.session.adminUsername,
    activePage: 'webapp'
  });
});

module.exports = router;