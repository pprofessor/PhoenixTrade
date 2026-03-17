const TelegramBot = require('node-telegram-bot-api');
const { BotMenu, BotMessage, BotUser, BotUserMessage, EducationalContent, Broker, sequelize } = require('../models');
const { Op } = require('sequelize');

const token = '8223148206:AAGIN2pqe7we5TPU8jNDDISoCFYm2FfhonQ';
const bot = new TelegramBot(token, { polling: true });

// User state store
const userState = new Map(); // chatId -> { history: [], currentMenuId, language: 'fa' }

// ============= توابع کمکی =============

// دریافت فرزندان یک منو
const getChildren = async (parentId) => {
  try {
    return await BotMenu.findAll({
      where: { parentId, isActive: true },
      order: [['order', 'ASC']],
      raw: true
    });
  } catch {
    return [];
  }
};

// دریافت منوی اصلی
const getRootMenu = async () => {
  try {
    return await BotMenu.findOne({
      where: { parentId: null, isActive: true },
      order: [['order', 'ASC']],
      raw: true
    });
  } catch {
    return null;
  }
};

// دریافت منو با آیدی
const getMenuById = async (menuId) => {
  try {
    return await BotMenu.findByPk(menuId, { raw: true });
  } catch {
    return null;
  }
};

// دریافت پیام بر اساس کلید
const getMessage = async (key) => {
  try {
    const msg = await BotMessage.findOne({ where: { key, isActive: true }, raw: true });
    return msg ? msg.text : null;
  } catch {
    return null;
  }
};

// به‌روزرسانی کاربر
const updateUser = async (tgUser) => {
  try {
    const [user, created] = await BotUser.findOrCreate({
      where: { telegramId: tgUser.id.toString() },
      defaults: {
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        lastInteraction: new Date()
      }
    });

    if (!created) {
      await user.update({
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        lastInteraction: new Date()
      });
    }
    return user;
  } catch {
    return null;
  }
};

// ذخیره پیام کاربر
const saveUserMessage = async (userId, message, response = null) => {
  try {
    await BotUserMessage.create({
      userId,
      message,
      response,
      type: 'text'
    });
  } catch (error) {
    console.error('Error saving message:', error);
  }
};

// ساخت کیبورد (دکمه‌های شیشه‌ای)
const buildInlineKeyboard = (menus, showBack = false, showMain = true, currentLang = 'fa') => {
  const inlineKeyboard = [];

  // دکمه‌های منو
  if (menus && menus.length > 0) {
    let row = [];
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      const btnText = `${menu.emoji || '🔹'} ${menu.text}`;
      row.push({ text: btnText, callback_data: `menu_${menu.id}` });

      // هر سطر ۲ دکمه
      if (row.length === 2 || i === menus.length - 1) {
        inlineKeyboard.push(row);
        row = [];
      }
    }
  }

  // دکمه‌های ناوبری
  const navRow = [];
  if (showBack) {
    navRow.push({ text: '🔙 منوی قبلی', callback_data: 'back' });
  }
  if (showMain) {
    navRow.push({ text: '🏠 منوی اصلی', callback_data: 'main' });
  }
  if (navRow.length > 0) {
    inlineKeyboard.push(navRow);
  }

  return inlineKeyboard.length > 0 ? { reply_markup: { inline_keyboard: inlineKeyboard } } : null;
};

// نمایش منو
const showMenu = async (chatId, menuId, msgId = null) => {
  const menu = await getMenuById(menuId);
  if (!menu) return false;

  const children = await getChildren(menu.id);
  const state = userState.get(chatId) || { history: [], currentMenuId: null, language: 'fa' };

  // عنوان + محتوا
  const title = `${menu.emoji || '🔹'} *${menu.text}*`;
  let content = menu.content || ' ';

  // اگر منوی لیست بروکرهاست، بروکرها را از دیتابیس بگیر
  if (menu.text === 'لیست بروکرها' || menu.id === 11) { // ID منوی لیست بروکرها
    const brokers = await Broker.findAll({
      where: { isActive: true },
      order: [['order', 'ASC'], ['rating', 'DESC']],
      limit: 10
    });

    if (brokers.length > 0) {
      content += '\n\n';
      brokers.forEach((broker, index) => {
        const brokerName = broker.display_name_fa || broker.name;
        content += `${index + 1}. ${brokerName} (⭐ ${broker.rating})\n`;
      });
    }
  }

  // اگر منوی آموزش است، محتوای آموزشی را از دیتابیس بگیر
  if (menu.text === 'آموزش‌ها' || menu.id === 2) { // ID منوی آموزش
    try {
      const categories = await EducationalContent.findAll({
        attributes: [[sequelize.fn('DISTINCT', sequelize.col('category')), 'category']],
        where: { isActive: true }
      });

      if (categories.length > 0) {
        content += '\n\n';
        categories.forEach((cat, index) => {
          let catName = '';
          switch (cat.category) {
            case 'basic': catName = 'مبتدی'; break;
            case 'strategy': catName = 'استراتژی'; break;
            case 'technical': catName = 'تحلیل تکنیکال'; break;
            case 'fundamental': catName = 'تحلیل بنیادی'; break;
            default: catName = cat.category;
          }
          content += `${index + 1}. ${catName}\n`;
        });
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }

  // ساخت کیبورد
  const keyboard = buildInlineKeyboard(
    children,
    state.history.length > 0,
    true,
    state.language
  );

  const text = `${title}\n\n${content}`;

  try {
    if (msgId) {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: 'Markdown',
        ...keyboard
      });
    } else {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        ...keyboard
      });
    }

    // به‌روزرسانی وضعیت
    state.currentMenuId = menu.id;
    userState.set(chatId, state);
    return true;

  } catch (e) {
    if (!e.message.includes('message is not modified')) {
      console.error('Menu error:', e.message);
    }
    return false;
  }
};

// نمایش منوی اصلی
const showMainMenu = async (chatId, welcomeBack = false) => {
  const root = await getRootMenu();
  if (!root) {
    await bot.sendMessage(chatId, 'سیستم در حال راه‌اندازی است.');
    return;
  }

  const children = await getChildren(root.id);
  const state = userState.get(chatId) || { history: [], language: 'fa' };

  const welcome = welcomeBack
    ? (await getMessage('welcome_return') || 'خوش آمدید')
    : (await getMessage('welcome_new') || 'به ربات خوش آمدید');

  const title = `🏠 *منوی اصلی*`;
  const text = `${title}\n\n${welcome}`;

  const keyboard = buildInlineKeyboard(children, false, false, state.language);

  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...keyboard
  });

  userState.set(chatId, { history: [], currentMenuId: root.id, language: state.language });
};

// ============= هندلرهای ربات =============

// دستور /start
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await updateUser(msg.from);

  // حذف کیبورد قبلی
  await bot.sendMessage(chatId, 'لطفاً صبر کنید...', { reply_markup: { remove_keyboard: true } })
    .then(sentMsg => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => { }));

  await showMainMenu(chatId, false);
});

// دستور /menu
bot.onText(/\/menu/, async (msg) => {
  await showMainMenu(msg.chat.id, true);
});

// هندلر callback_query
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const msgId = q.message.message_id;
  const data = q.data;

  // پاسخ به callback_query با مدیریت خطا
  try {
    await bot.answerCallbackQuery(q.id);
  } catch (e) {
    // این خطا معمولاً به دلیل منقضی شدن کوئری است و بی‌ضرر می‌باشد
    console.log('⚠️ AnswerCallbackQuery warning (ignored):', e.message);
  }

  await updateUser(q.from);

  const state = userState.get(chatId) || { history: [], currentMenuId: null, language: 'fa' };

  // بازگشت به منوی اصلی
  if (data === 'main') {
    await showMainMenu(chatId, true);
    return;
  }

  // بازگشت به منوی قبلی
  if (data === 'back') {
    if (state.history.length > 0) {
      const parentId = state.history.pop();
      const parent = await getMenuById(parentId);
      if (parent) {
        state.currentMenuId = parent.id;
        userState.set(chatId, state);
        await showMenu(chatId, parent.id, msgId);
      } else {
        await showMainMenu(chatId, true);
      }
    } else {
      await showMainMenu(chatId, true);
    }
    return;
  }

  // انتخاب منو
  if (data.startsWith('menu_')) {
    const menuId = parseInt(data.split('_')[1]);
    const menu = await getMenuById(menuId);
    if (!menu) return;

    // به‌روزرسانی تاریخچه
    if (state.currentMenuId && state.currentMenuId !== menu.id) {
      state.history.push(state.currentMenuId);
    }
    state.currentMenuId = menu.id;
    userState.set(chatId, state);

    await showMenu(chatId, menu.id, msgId);

    // ذخیره پیام
    try {
      const dbUser = await BotUser.findOne({ where: { telegramId: q.from.id.toString() } });
      if (dbUser) {
        await saveUserMessage(dbUser.id, menu.text, 'منو انتخاب شد');
      }
    } catch (error) {
      console.error('❌ Error saving user message:', error);
    }
  }
});

// پیام‌های متنی (برای منوی انتخاب زبان)
bot.on('message', async (msg) => {
  if (msg.text && !msg.text.startsWith('/') && !msg.text.startsWith('🔙')) {
    const chatId = msg.chat.id;
    const text = msg.text;
    const state = userState.get(chatId) || { history: [], language: 'fa' };

    // بررسی منوی انتخاب زبان
    const currentMenu = await getMenuById(state.currentMenuId);
    if (currentMenu && currentMenu.text === 'انتخاب زبان') {
      let newLang = 'fa';
      if (text.includes('English') || text.includes('EN')) newLang = 'en';
      if (text.includes('العربية') || text.includes('AR')) newLang = 'ar';

      state.language = newLang;
      userState.set(chatId, state);

      await bot.sendMessage(chatId, `🌐 زبان به ${text} تغییر یافت`);
      await showMainMenu(chatId, true);
      return;
    }

    // اگر منو پیدا نشد، منوی اصلی را نشان بده
    const menu = await BotMenu.findOne({
      where: { text: { [Op.like]: `%${text}%` }, isActive: true }
    });

    if (menu) {
      // به‌روزرسانی تاریخچه
      if (state.currentMenuId && state.currentMenuId !== menu.id) {
        state.history.push(state.currentMenuId);
      }
      state.currentMenuId = menu.id;
      userState.set(chatId, state);

      await showMenu(chatId, menu.id);
    } else {
      await showMainMenu(chatId, true);
    }
  }
});

// ============= وضعیت ربات =============
bot.getMe().then((info) => {
  console.log(`✅ ربات @${info.username} با موفقیت متصل شد`);
}).catch((error) => {
  console.error('❌ خطا در اتصال ربات:', error.message);
});

module.exports = {
  bot,
  checkBotStatus: async () => {
    try {
      const info = await bot.getMe();
      return { online: true, username: info.username };
    } catch {
      return { online: false };
    }
  }
};