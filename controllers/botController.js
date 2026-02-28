const { BotMenu, BotMessage, BotUser, BotUserMessage, WebappPage } = require('../models');

// ============= صفحه اصلی مدیریت ربات =============
const botIndex = async (req, res) => {
  try {
    // دریافت همه منوها
    const allMenus = await BotMenu.findAll({
      where: { isActive: true },
      order: [['order', 'ASC']]
    });

    // پیدا کردن منوهای اصلی (اونایی که parentId ندارن)
    const mainMenus = allMenus.filter(menu => !menu.parentId);

    // دریافت پیام‌ها
    const messages = await BotMessage.findAll({
      where: { isActive: true }
    });

    // دریافت APIهای موجود از WebappPage
    const apis = await WebappPage.findAll({
      where: { isActive: true },
      attributes: ['id', 'slug', 'title']
    });

    res.render('bot/index', {
      title: 'مدیریت ربات',
      user: req.session.adminUsername,
      activePage: 'bot',
      menus: allMenus, // کل منوها رو بفرست
      mainMenus: mainMenus, // منوهای اصلی رو جداگانه بفرست
      messages: messages,
      apis: apis
    });

  } catch (error) {
    console.error('❌ خطا در بارگذاری صفحه ربات:', error);
    res.status(500).send('خطای سرور');
  }
};

// ============= مدیریت منوها =============
const getMenus = async (req, res) => {
  try {
    const menus = await BotMenu.findAll({
      include: [{ model: BotMenu, as: 'submenus' }],
      order: [['order', 'ASC']]
    });
    res.json(menus);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const createMenu = async (req, res) => {
  try {
    const menu = await BotMenu.create(req.body);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMenu = async (req, res) => {
  try {
    const menu = await BotMenu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ error: 'منو یافت نشد' });
    
    await menu.update(req.body);
    res.json(menu);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const deleteMenu = async (req, res) => {
  try {
    const menu = await BotMenu.findByPk(req.params.id);
    if (!menu) return res.status(404).json({ error: 'منو یافت نشد' });
    
    await menu.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============= مدیریت پیام‌ها =============
const getMessages = async (req, res) => {
  try {
    const messages = await BotMessage.findAll();
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const updateMessage = async (req, res) => {
  try {
    const message = await BotMessage.findByPk(req.params.id);
    if (!message) return res.status(404).json({ error: 'پیام یافت نشد' });
    
    await message.update(req.body);
    res.json(message);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// ============= مدیریت کاربران =============
const getUsers = async (req, res) => {
  try {
    const users = await BotUser.findAll({
      order: [['createdAt', 'DESC']]
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
      order: [['createdAt', 'ASC']]
    });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

module.exports = {
  botIndex,
  getMenus, createMenu, updateMenu, deleteMenu,
  getMessages, updateMessage,
  getUsers, getUserMessages
};