const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');
const botController = require('../controllers/botController');

// ============= مسیرهای اصلی مدیریت =============
router.get('/dashboard', isAuthenticated, (req, res) => {
  res.render('dashboard', { 
    title: 'داشبورد مدیریت',
    user: req.session.adminUsername,
    activePage: 'dashboard'
  });
});

// 1- مدیریت بکاپ
router.get('/backup', isAuthenticated, (req, res) => {
  res.render('backup', { 
    title: 'مدیریت بکاپ',
    user: req.session.adminUsername,
    activePage: 'backup'
  });
});

// 2- مدیریت دیتابیس
router.get('/database', isAuthenticated, (req, res) => {
  res.render('database', { 
    title: 'مدیریت دیتابیس',
    user: req.session.adminUsername,
    activePage: 'database'
  });
});

// ============= مسیرهای مدیریت ربات =============
// صفحه اصلی مدیریت ربات
router.get('/bot', isAuthenticated, botController.botIndex);

// API های منوها
router.get('/api/bot/menus', isAuthenticated, botController.getMenus);

router.post('/api/bot/menus', isAuthenticated, async (req, res) => {
    try {
        const { BotMenu } = require('../models');
        const menuData = req.body;
        
        // اعتبارسنجی
        if (!menuData.text) {
            return res.status(400).json({ error: 'متن منو الزامی است' });
        }
        
        // بررسی parentId برای زیرمنو
        if (menuData.type === 'submenu') {
            if (!menuData.parentId) {
                return res.status(400).json({ error: 'منوی والد برای زیرمنو الزامی است' });
            }
            // بررسی وجود منوی والد
            const parentMenu = await BotMenu.findByPk(menuData.parentId);
            if (!parentMenu) {
                return res.status(400).json({ error: 'منوی والد معتبر نیست' });
            }
        }
        
        // حذف فیلدهای اضافی
        delete menuData.id;
        delete menuData.createdAt;
        delete menuData.updatedAt;
        
        // اگر parentId برای منوی اصلی null باشه
        if (menuData.type === 'main') {
            menuData.parentId = null;
        }
        
        const menu = await BotMenu.create(menuData);
        res.json(menu);
    } catch (error) {
        console.error('❌ خطا در ایجاد منو:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/api/bot/menus/:id', isAuthenticated, async (req, res) => {
    try {
        const { BotMenu } = require('../models');
        const menu = await BotMenu.findByPk(req.params.id);
        
        if (!menu) {
            return res.status(404).json({ error: 'منو یافت نشد' });
        }
        
        const menuData = req.body;
        
        // اعتبارسنجی برای زیرمنو
        if (menuData.type === 'submenu' && menuData.parentId) {
            const parentMenu = await BotMenu.findByPk(menuData.parentId);
            if (!parentMenu) {
                return res.status(400).json({ error: 'منوی والد معتبر نیست' });
            }
        }
        
        // اگر منوی اصلیه، parentId رو null کن
        if (menuData.type === 'main') {
            menuData.parentId = null;
        }
        
        await menu.update(menuData);
        res.json(menu);
    } catch (error) {
        console.error('❌ خطا در ویرایش منو:', error);
        res.status(500).json({ error: error.message });
    }
});

router.delete('/api/bot/menus/:id', isAuthenticated, async (req, res) => {
    try {
        const { BotMenu } = require('../models');
        const menu = await BotMenu.findByPk(req.params.id);
        
        if (!menu) {
            return res.status(404).json({ error: 'منو یافت نشد' });
        }
        
        // بررسی وجود زیرمنو برای این منو
        const submenus = await BotMenu.findAll({ where: { parentId: menu.id } });
        if (submenus.length > 0) {
            return res.status(400).json({ error: 'این منو دارای زیرمنو است. ابتدا زیرمنوها را حذف کنید' });
        }
        
        await menu.destroy();
        res.json({ success: true });
    } catch (error) {
        console.error('❌ خطا در حذف منو:', error);
        res.status(500).json({ error: error.message });
    }
});

// API های دستورات (اختیاری - فعلاً غیرفعال)
// router.get('/api/bot/commands', isAuthenticated, botController.getCommands);
// router.post('/api/bot/commands', isAuthenticated, botController.createCommand);
// router.put('/api/bot/commands/:id', isAuthenticated, botController.updateCommand);
// router.delete('/api/bot/commands/:id', isAuthenticated, botController.deleteCommand);

// ============= API های پیام‌ها =============
router.get('/api/bot/messages', isAuthenticated, async (req, res) => {
    try {
        const { BotMessage } = require('../models');
        const messages = await BotMessage.findAll();
        res.json(messages);
    } catch (error) {
        console.error('❌ خطا در دریافت پیام‌ها:', error);
        res.status(500).json({ error: error.message });
    }
});

router.post('/api/bot/messages', isAuthenticated, async (req, res) => {
    try {
        const { BotMessage } = require('../models');
        const { key, text } = req.body;
        
        // پیدا کردن یا ایجاد پیام
        const [message, created] = await BotMessage.findOrCreate({
            where: { key },
            defaults: { key, text }
        });
        
        if (!created) {
            await message.update({ text });
        }
        
        res.json({ success: true, message });
    } catch (error) {
        console.error('❌ خطا در ذخیره پیام:', error);
        res.status(500).json({ error: error.message });
    }
});

router.put('/api/bot/messages/:id', isAuthenticated, async (req, res) => {
    try {
        const { BotMessage } = require('../models');
        const message = await BotMessage.findByPk(req.params.id);
        if (!message) {
            return res.status(404).json({ error: 'پیام یافت نشد' });
        }
        await message.update(req.body);
        res.json(message);
    } catch (error) {
        console.error('❌ خطا در ویرایش پیام:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= API های کاربران =============
router.get('/api/bot/users', isAuthenticated, async (req, res) => {
    try {
        const { BotUser } = require('../models');
        const users = await BotUser.findAll({
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        console.error('❌ خطا در دریافت کاربران:', error);
        res.status(500).json({ error: error.message });
    }
});

router.get('/api/bot/users/:id/messages', isAuthenticated, async (req, res) => {
    try {
        const { BotUserMessage } = require('../models');
        const messages = await BotUserMessage.findAll({
            where: { userId: req.params.id },
            order: [['createdAt', 'ASC']]
        });
        res.json(messages);
    } catch (error) {
        console.error('❌ خطا در دریافت پیام‌های کاربر:', error);
        res.status(500).json({ error: error.message });
    }
});

// ============= وضعیت ربات =============
router.get('/api/bot/status', isAuthenticated, async (req, res) => {
    try {
        const { bot } = require('../services/telegramBot');
        const botInfo = await bot.getMe();
        res.json({ online: true, username: botInfo.username });
    } catch (error) {
        console.error('❌ خطا در بررسی وضعیت ربات:', error);
        res.json({ online: false, error: error.message });
    }
});

// 4- مدیریت وب اپ
router.get('/webapp', isAuthenticated, (req, res) => {
  res.render('webapp/index', { 
    title: 'مدیریت وب اپ',
    user: req.session.adminUsername,
    activePage: 'webapp'
  });
});

// 5- مدیریت API های عمومی
router.get('/api-settings', isAuthenticated, (req, res) => {
  res.render('api-settings', { 
    title: 'تنظیمات API',
    user: req.session.adminUsername,
    activePage: 'api'
  });
});

module.exports = router;