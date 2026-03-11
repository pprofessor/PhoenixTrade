const TelegramBot = require('node-telegram-bot-api');
const { BotMenu, BotMessage, BotUser, BotUserMessage } = require('../models');

const token = '8223148206:AAGIN2pqe7we5TPU8jNDDISoCFYm2FfhonQ';
const bot = new TelegramBot(token, { polling: true });

// User state store
const userState = new Map();

// Helper: get children
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

// Helper: get root menu
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

// Helper: get menu by ID
const getMenuById = async (menuId) => {
  try {
    return await BotMenu.findByPk(menuId, { raw: true });
  } catch {
    return null;
  }
};

// Helper: get message by key
const getMessage = async (key) => {
  try {
    const msg = await BotMessage.findOne({ where: { key, isActive: true }, raw: true });
    return msg ? msg.text : null;
  } catch {
    return null;
  }
};

// Helper: update user
const updateUser = async (tgUser) => {
  try {
    const [user] = await BotUser.findOrCreate({
      where: { telegramId: tgUser.id.toString() },
      defaults: {
        firstName: tgUser.first_name,
        lastName: tgUser.last_name,
        username: tgUser.username,
        lastInteraction: new Date()
      }
    });
    if (!user.isNewRecord) {
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

// Build inline keyboard (with navigation buttons)
const buildKeyboard = (menus, showBack = false, showMain = false) => {
  const inlineKeyboard = [];
  
  // Add menu buttons if any
  if (menus?.length) {
    let row = [];
    for (let i = 0; i < menus.length; i++) {
      const menu = menus[i];
      const btnText = `${menu.emoji || '🔹'} ${menu.text}`;
      row.push({ text: btnText, callback_data: `menu_${menu.id}` });
      if (row.length === 2 || i === menus.length - 1) {
        inlineKeyboard.push(row);
        row = [];
      }
    }
  }
  
  // Navigation buttons (always added if needed)
  const nav = [];
  if (showBack) nav.push({ text: '🔙 منوی قبلی', callback_data: 'back' });
  if (showMain) nav.push({ text: '🏠 منوی اصلی', callback_data: 'main' });
  if (nav.length) inlineKeyboard.push(nav);
  
  return inlineKeyboard.length ? { reply_markup: { inline_keyboard: inlineKeyboard } } : null;
};

// Show menu (edits existing message)
const showMenu = async (chatId, menuId, msgId) => {
  const menu = await getMenuById(menuId);
  if (!menu) return false;
  
  const children = await getChildren(menu.id);
  const state = userState.get(chatId) || { history: [] };
  const hasChildren = children.length > 0;
  
  // Title + content (both centered naturally due to RTL)
  const title = `${menu.emoji || '🔹'} ${menu.text}`;
  const content = menu.content || '  ';
  const text = `*${title}*\n\n${content}`;
  
  // Build keyboard: always show navigation if needed, regardless of children
  const keyboard = buildKeyboard(
    children,
    state.history.length > 0,      // show back if history exists
    true                            // always show main menu button
  );
  
  try {
    if (msgId) {
      await bot.editMessageText(text, {
        chat_id: chatId,
        message_id: msgId,
        parse_mode: 'Markdown',
        ...(keyboard || {})
      });
    } else {
      await bot.sendMessage(chatId, text, {
        parse_mode: 'Markdown',
        ...(keyboard || {})
      });
    }
    
    // Update state (only if this menu has children, to allow back navigation)
    if (hasChildren) {
      state.currentMenuId = menu.id;
      userState.set(chatId, state);
    } else {
      // For leaf menus, we keep state as is (history already contains parent)
      // No need to change currentMenuId because we are not going deeper
    }
    return true;
  } catch (e) {
    if (!e.message.includes('message is not modified')) {
      console.error('Menu error:', e.message);
    }
    return false;
  }
};

// Show main menu
const showMainMenu = async (chatId, welcomeBack = false) => {
  const root = await getRootMenu();
  if (!root) {
    await bot.sendMessage(chatId, 'سیستم در حال راه‌اندازی است.');
    return;
  }
  
  const children = await getChildren(root.id);
  const welcome = welcomeBack
    ? (await getMessage('welcome_return') || 'خوش آمدید')
    : (await getMessage('welcome_new') || 'به ربات خوش آمدید');
  
  const text = `*🏠 منوی اصلی*\n\n${welcome}`;
  const keyboard = children.length ? buildKeyboard(children, false, false) : null;
  
  await bot.sendMessage(chatId, text, {
    parse_mode: 'Markdown',
    ...(keyboard || {})
  });
  userState.set(chatId, { history: [], currentMenuId: root.id });
};

// Commands
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  await updateUser(msg.from);
  // حذف هر کیبورد قبلی و نمایش مستقیم منوی اصلی
  await bot.sendMessage(chatId, 'چند لحظه کن  ...', { reply_markup: { remove_keyboard: true } })
    .then(sentMsg => bot.deleteMessage(chatId, sentMsg.message_id).catch(() => {}));
  await showMainMenu(chatId, false);
});

bot.onText(/\/menu/, async (msg) => {
  await showMainMenu(msg.chat.id, true);
});

// Callback queries
bot.on('callback_query', async (q) => {
  const chatId = q.message.chat.id;
  const msgId = q.message.message_id;
  const data = q.data;
  
  await bot.answerCallbackQuery(q.id);
  await updateUser(q.from);
  
  const state = userState.get(chatId) || { history: [], currentMenuId: null };
  
  if (data === 'main') {
    await showMainMenu(chatId, true);
    return;
  }
  
  if (data === 'back') {
    if (state.history.length) {
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
  
  if (data.startsWith('menu_')) {
    const menuId = parseInt(data.split('_')[1]);
    const menu = await getMenuById(menuId);
    if (!menu) return;
    
    // Update history
    if (state.currentMenuId && state.currentMenuId !== menu.id) {
      state.history.push(state.currentMenuId);
    }
    state.currentMenuId = menu.id;
    userState.set(chatId, state);
    
    await showMenu(chatId, menu.id, msgId);
    
    // Save message
    const dbUser = await BotUser.findOne({ where: { telegramId: q.from.id.toString() } });
    if (dbUser) {
      await BotUserMessage.create({
        userId: dbUser.id,
        message: menu.text,
        response: 'منو انتخاب شد',
        type: 'text'
      });
    }
  }
});

// Ready Message
bot.getMe().then((info) => {
  console.log(`✅ Bot @${info.username} Connected To Server`);
});

module.exports = { bot, checkBotStatus: async () => {
  try {
    const info = await bot.getMe();
    return { online: true, username: info.username };
  } catch {
    return { online: false };
  }
} };