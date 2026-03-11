const { BotMenu, BotMessage, BotUser, BotUserMessage, WebappPage } = require('../models');
const { checkBotStatus } = require('../services/telegramBot');
const multer = require('multer');
const path = require('path');

// ============= تنظیمات آپلود فایل =============
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/')
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|mp4|mp3|pdf|doc|docx/;
    const ext = path.extname(file.originalname).toLowerCase();
    if (allowedTypes.test(ext)) {
      cb(null, true);
    } else {
      cb(new Error('نوع فایل مجاز نیست'));
    }
  }
});

// ============= صفحه اصلی مدیریت ربات =============
const botIndex = async (req, res) => {
  try {
    // دریافت همه منوها
    const allMenus = await BotMenu.findAll({
      order: [['parentId', 'ASC'], ['order', 'ASC']]
    });

    // ساختن ساختار درختی
    const menuTree = [];
    const menuMap = {};
    
    allMenus.forEach(menu => {
      menuMap[menu.id] = { ...menu.toJSON(), children: [] };
    });
    
    allMenus.forEach(menu => {
      if (menu.parentId) {
        if (menuMap[menu.parentId]) {
          menuMap[menu.parentId].children.push(menuMap[menu.id]);
        }
      } else {
        menuTree.push(menuMap[menu.id]);
      }
    });

    // دریافت پیام‌ها
    const messages = await BotMessage.findAll({
      where: { isActive: true }
    });

    // دریافت صفحات وب‌اپ
    let webappPages = [];
    try {
      webappPages = await WebappPage.findAll({
        where: { isActive: true },
        attributes: ['id', 'title', 'slug'],
        order: [['title', 'ASC']]
      });
      console.log(`✅ ${webappPages.length}"Page Not Found"`);
    } catch (err) {
      console.error('❌ Error In Web Page Recieve', err.message);
    }

    // وضعیت ربات
    const botStatus = await checkBotStatus();

    res.render('bot', {
      title: 'مدیریت ربات',
      user: req.session.adminUsername,
      activePage: 'bot',
      menuTree: menuTree,
      allMenus: allMenus,
      messages: messages,
      webappPages: webappPages,
      apis: [],
      botStatus: botStatus
    });

  } catch (error) {
    console.error('❌ Bot index error:', error);
    res.status(500).send("Server Error");
  }
};

// ============= مدیریت منوها =============
const getMenus = async (req, res) => {
  try {
    const menus = await BotMenu.findAll({
      order: [['parentId', 'ASC'], ['order', 'ASC']],
      include: [{ model: BotMenu, as: 'children' }]
    });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMenu = async (req, res) => {
  try {
    console.log('📝 ایجاد منوی جدید:', req.body);
    
    const menuData = {
      text: req.body.text,
      emoji: req.body.emoji || null,
      parentId: req.body.parentId || null,
      content: req.body.content || '',
      order: req.body.order || 0,
      isActive: true,
      // فیلدهای جدید
      button_url: req.body.button_url || null,
      media_url: req.body.media_url || null,
      media_type: req.body.media_type || null
    };
    
    const menu = await BotMenu.create(menuData);
    
    console.log('✅ منو ایجاد شد، ID:', menu.id);
    
    const newMenu = await BotMenu.findByPk(menu.id, {
      include: [{ model: BotMenu, as: 'children' }]
    });
    
    res.status(201).json(newMenu);
  } catch (error) {
    console.error('❌ خطا در ایجاد منو:', error);
    res.status(500).json({ error: error.message });
  }
};

const updateMenu = async (req, res) => {
  try {
    console.log('📝 ویرایش منو ID:', req.params.id, req.body);
    
    const menu = await BotMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ error: 'منو یافت نشد' });
    }
    
    await menu.update({
      text: req.body.text,
      emoji: req.body.emoji || null,
      parentId: req.body.parentId || null,
      content: req.body.content,
      order: req.body.order,
      isActive: req.body.isActive !== undefined ? req.body.isActive : menu.isActive,
      button_url: req.body.button_url || null,
      media_url: req.body.media_url || null,
      media_type: req.body.media_type || null
    });
    
    console.log('✅ منو ویرایش شد');
    
    const updatedMenu = await BotMenu.findByPk(menu.id, {
      include: [{ model: BotMenu, as: 'children' }]
    });
    
    res.json(updatedMenu);
  } catch (error) {
    console.error('❌ خطا در ویرایش منو:', error);
    res.status(500).json({ error: error.message });
  }
};

const deleteMenu = async (req, res) => {
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
};

// ============= مدیریت پیام‌ها =============
const getMessages = async (req, res) => {
  try {
    const messages = await BotMessage.findAll({
      order: [['key', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    const message = await BotMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'پیام یافت نشد' });
    
    await message.update({
      text: req.body.text,
      media: req.body.media,
      buttons: req.body.buttons,
      isActive: req.body.isActive
    });
    
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============= مدیریت کاربران =============
const getUsers = async (req, res) => {
  try {
    const users = await BotUser.findAll({
      order: [['createdAt', 'DESC']],
      include: [{ model: BotUserMessage, as: 'messages', limit: 1, order: [['createdAt', 'DESC']] }]
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const getUserMessages = async (req, res) => {
  try {
    const messages = await BotUserMessage.findAll({
      where: { userId: req.params.id },
      order: [['createdAt', 'ASC']],
      include: [{ model: BotUser, as: 'user' }]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============= وضعیت ربات =============
const getBotStatus = async (req, res) => {
  try {
    const status = await checkBotStatus();
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  botIndex,
  getMenus, createMenu, updateMenu, deleteMenu,
  getMessages, updateMessage,
  getUsers, getUserMessages,
  getBotStatus
};