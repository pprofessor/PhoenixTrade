// const TelegramBot = require('node-telegram-bot-api');
// const { BotMenu, BotMessage, BotUser, BotUserMessage } = require('../models');

// const token = '8223148206:AAGIN2pqe7we5TPU8jNDDISoCFYm2FfhonQ';
// const bot = new TelegramBot(token, { polling: true });

// // ============= ذخیره وضعیت کاربر (برای دکمه بازگشت) =============
// const userState = new Map(); // chatId -> { currentMenuId, history[] }

// // ============= توابع کمکی =============

// // ساخت کیبورد از لیست منوها
// function buildKeyboardFromMenus(menus, showBackButton = false) {
//     if (!menus || menus.length === 0) return null;
    
//     const keyboard = [];
//     let row = [];
    
//     for (let i = 0; i < menus.length; i++) {
//         const menu = menus[i];
//         const buttonText = (menu.emoji ? menu.emoji + ' ' : '') + menu.text;
//         row.push(buttonText);
        
//         if (row.length === 2 || i === menus.length - 1) {
//             keyboard.push(row);
//             row = [];
//         }
//     }
    
//     if (showBackButton) {
//         keyboard.push(['🔙 بازگشت']);
//     }
    
//     return {
//         reply_markup: {
//             keyboard: keyboard,
//             resize_keyboard: true
//         }
//     };
// }

// // دریافت زیرمنوهای یک منو
// async function getSubmenus(menuId) {
//     return await BotMenu.findAll({
//         where: { parentId: menuId, isActive: true },
//         order: [['order', 'ASC']]
//     });
// }

// // دریافت منوی اصلی
// async function getMainMenu() {
//     return await BotMenu.findOne({
//         where: { type: 'main', isActive: true },
//         order: [['order', 'ASC']]
//     });
// }

// // دریافت پیام بر اساس کلید
// async function getMessageByKey(key) {
//     try {
//         const message = await BotMessage.findOne({
//             where: { key, isActive: true }
//         });
//         return message ? message.text : null;
//     } catch (error) {
//         return null;
//     }
// }

// // ثبت یا به‌روزرسانی کاربر
// async function updateUser(telegramUser) {
//     try {
//         const [user, created] = await BotUser.findOrCreate({
//             where: { telegramId: telegramUser.id.toString() },
//             defaults: {
//                 firstName: telegramUser.first_name,
//                 lastName: telegramUser.last_name,
//                 username: telegramUser.username,
//                 lastInteraction: new Date()
//             }
//         });
        
//         if (!created) {
//             await user.update({
//                 firstName: telegramUser.first_name,
//                 lastName: telegramUser.last_name,
//                 username: telegramUser.username,
//                 lastInteraction: new Date()
//             });
//         }
        
//         return user;
//     } catch (error) {
//         console.error('❌ خطا در ثبت کاربر:', error);
//         return null;
//     }
// }

// // ثبت پیام کاربر
// async function saveUserMessage(userId, message, response = null) {
//     try {
//         await BotUserMessage.create({
//             userId,
//             message,
//             response,
//             type: 'text'
//         });
//     } catch (error) {
//         console.error('❌ خطا در ثبت پیام:', error);
//     }
// }

// // ============= نمایش منو =============
// async function showMenu(chatId, menuId, customText = null) {
//     try {
//         const menu = await BotMenu.findByPk(menuId);
//         if (!menu) return false;
        
//         // دریافت زیرمنوها
//         const submenus = await getSubmenus(menu.id);
        
//         // ذخیره وضعیت کاربر
//         const state = userState.get(chatId) || { history: [] };
//         state.currentMenuId = menu.id;
//         userState.set(chatId, state);
        
//         if (submenus.length > 0) {
//             // اگه زیرمنو داره، زیرمنوها رو نمایش بده
//             const keyboard = buildKeyboardFromMenus(submenus, true);
//             const text = customText || menu.content || menu.text + ':';
//             await bot.sendMessage(chatId, text, keyboard);
//         } else {
//             // اگه زیرمنو نداره، محتوا رو نمایش بده
//             await bot.sendMessage(chatId, menu.content || 'اطلاعات این بخش موجود نیست');
            
//             // بعد از نمایش محتوا، منوی قبلی رو نشون بده (اگه تاریخچه داره)
//             if (state.history.length > 0) {
//                 const parentId = state.history[state.history.length - 1];
//                 const parentMenu = await BotMenu.findByPk(parentId);
//                 if (parentMenu) {
//                     const parentSubmenus = await getSubmenus(parentId);
//                     if (parentSubmenus.length > 0) {
//                         const keyboard = buildKeyboardFromMenus(parentSubmenus, true);
//                         await bot.sendMessage(chatId, parentMenu.content || parentMenu.text + ':', keyboard);
//                     }
//                 }
//             }
//         }
        
//         return true;
//     } catch (error) {
//         console.error('❌ خطا در نمایش منو:', error);
//         return false;
//     }
// }

// // ============= نمایش منوی اصلی =============
// async function showMainMenu(chatId) {
//     const mainMenu = await getMainMenu();
//     if (!mainMenu) {
//         await bot.sendMessage(chatId, 'منویی تعریف نشده است.');
//         return;
//     }
    
//     const submenus = await getSubmenus(mainMenu.id);
    
//     // ریست وضعیت کاربر
//     userState.set(chatId, { history: [], currentMenuId: mainMenu.id });
    
//     if (submenus.length > 0) {
//         const keyboard = buildKeyboardFromMenus(submenus, false);
//         const welcomeReturn = await getMessageByKey('welcome_return') || 'منوی اصلی:';
//         await bot.sendMessage(chatId, welcomeReturn, keyboard);
//     } else {
//         await bot.sendMessage(chatId, mainMenu.content || 'منوی اصلی');
//     }
// }

// // ============= رویدادهای ربات =============

// // دستور /start
// bot.onText(/\/start/, async (msg) => {
//     const chatId = msg.chat.id;
//     await updateUser(msg.from);
    
//     const welcomeText = await getMessageByKey('welcome_new') || 'به ربات خوش آمدید';
//     await bot.sendMessage(chatId, welcomeText);
//     await showMainMenu(chatId);
// });

// // دستور /menu
// bot.onText(/\/menu/, async (msg) => {
//     await showMainMenu(msg.chat.id);
// });

// // دکمه بازگشت
// bot.onText(/🔙 بازگشت/, async (msg) => {
//     const chatId = msg.chat.id;
//     const state = userState.get(chatId);
    
//     if (state && state.history.length > 0) {
//         // برگشت به منوی قبلی
//         const previousMenuId = state.history.pop();
//         state.currentMenuId = previousMenuId;
//         userState.set(chatId, state);
        
//         const previousMenu = await BotMenu.findByPk(previousMenuId);
//         if (previousMenu) {
//             const submenus = await getSubmenus(previousMenuId);
//             const keyboard = buildKeyboardFromMenus(submenus, state.history.length > 0);
//             await bot.sendMessage(chatId, previousMenu.content || previousMenu.text + ':', keyboard);
//         } else {
//             await showMainMenu(chatId);
//         }
//     } else {
//         // اگه تاریخچه نبود، برو به منوی اصلی
//         await showMainMenu(chatId);
//     }
// });

// // پیام‌های متنی (انتخاب منو)
// bot.on('message', async (msg) => {
//     if (msg.text && !msg.text.startsWith('/') && !msg.text.startsWith('🔙')) {
//         const chatId = msg.chat.id;
//         const text = msg.text;
//         const user = await updateUser(msg.from);
        
//         // حذف ایموجی از ابتدای متن برای جستجو
//         const cleanText = text.replace(/^[\u{1F600}-\u{1F6FF}\s]+/u, '').trim();
        
//         // جستجوی منو با این متن
//         const menu = await BotMenu.findOne({
//             where: { text: cleanText, isActive: true }
//         });
        
//         if (menu) {
//             const state = userState.get(chatId) || { history: [] };
            
//             // اگه منوی قبلی وجود داره و با منوی فعلی فرق داره، به تاریخچه اضافه کن
//             if (state.currentMenuId && state.currentMenuId !== menu.id) {
//                 state.history.push(state.currentMenuId);
//             }
            
//             state.currentMenuId = menu.id;
//             userState.set(chatId, state);
            
//             // دریافت زیرمنوها
//             const submenus = await getSubmenus(menu.id);
            
//             if (submenus.length > 0) {
//                 // نمایش زیرمنوها
//                 const keyboard = buildKeyboardFromMenus(submenus, state.history.length > 0);
//                 await bot.sendMessage(chatId, menu.content || menu.text + ':', keyboard);
//             } else {
//                 // نمایش محتوا
//                 await bot.sendMessage(chatId, menu.content || 'اطلاعات این بخش موجود نیست');
                
//                 // بعد از نمایش محتوا، منوی قبلی رو نشون بده
//                 if (state.history.length > 0) {
//                     const parentId = state.history[state.history.length - 1];
//                     const parentMenu = await BotMenu.findByPk(parentId);
//                     if (parentMenu) {
//                         const parentSubmenus = await getSubmenus(parentId);
//                         if (parentSubmenus.length > 0) {
//                             const keyboard = buildKeyboardFromMenus(parentSubmenus, state.history.length > 1);
//                             await bot.sendMessage(chatId, parentMenu.content || parentMenu.text + ':', keyboard);
//                         }
//                     }
//                 }
//             }
            
//             await saveUserMessage(user.id, text, 'منو انتخاب شد');
//         } else {
//             // متن نامعتبر
//             await showMainMenu(chatId);
//         }
//     }
// });

// // ============= وضعیت سنجی ربات =============
// bot.getMe().then((botInfo) => {
//     console.log('🤖 ربات @' + botInfo.username + ' فعال شد');
// }).catch((error) => {
//     console.error('❌ خطا در اتصال ربات:', error);
// });

// // API برای وضعیت
// const checkBotStatus = async () => {
//     try {
//         const botInfo = await bot.getMe();
//         return { online: true, username: botInfo.username };
//     } catch (error) {
//         return { online: false, error: error.message };
//     }
// };

// module.exports = { bot, checkBotStatus };






const TelegramBot = require('node-telegram-bot-api');
const { BotMenu, BotMessage, BotUser, BotUserMessage } = require('../models');

const token = '8223148206:AAGIN2pqe7we5TPU8jNDDISoCFYm2FfhonQ';
const bot = new TelegramBot(token, { polling: true });

// ============= ذخیره وضعیت کاربر =============
const userState = new Map(); // chatId -> { currentMenuId, history[] }

// ============= توابع کمکی =============

// ساخت کیبورد از لیست منوها
function buildKeyboard(menus, showBack = false) {
    if (!menus || menus.length === 0) return null;
    
    const keyboard = [];
    let row = [];
    
    for (let i = 0; i < menus.length; i++) {
        const menu = menus[i];
        const btnText = (menu.emoji || '🔹') + ' ' + menu.text;
        row.push(btnText);
        
        if (row.length === 2 || i === menus.length - 1) {
            keyboard.push(row);
            row = [];
        }
    }
    
    if (showBack) {
        keyboard.push(['🔙 بازگشت']);
    }
    
    return {
        reply_markup: {
            keyboard: keyboard,
            resize_keyboard: true
        }
    };
}

// دریافت زیرمنوهای یک منو
async function getChildren(parentId) {
    return await BotMenu.findAll({
        where: { parentId, isActive: true },
        order: [['order', 'ASC']]
    });
}

// دریافت منوی اصلی
async function getRootMenu() {
    return await BotMenu.findOne({
        where: { parentId: null, isActive: true },
        order: [['order', 'ASC']]
    });
}

// دریافت پیام
async function getMessage(key) {
    const msg = await BotMessage.findOne({ where: { key } });
    return msg ? msg.text : null;
}

// ============= نمایش منو =============
async function showMenu(chatId, menuId) {
    const menu = await BotMenu.findByPk(menuId);
    if (!menu) return false;
    
    const children = await getChildren(menu.id);
    const state = userState.get(chatId) || { history: [] };
    
    if (children.length > 0) {
        // اگه فرزند داره، فرزندان رو نشون بده
        const keyboard = buildKeyboard(children, state.history.length > 0);
        await bot.sendMessage(chatId, menu.content || menu.text + ':', keyboard);
        state.currentMenuId = menu.id;
        userState.set(chatId, state);
    } else {
        // اگه فرزند نداره، محتوا رو نشون بده
        await bot.sendMessage(chatId, menu.content || 'اطلاعاتی موجود نیست');
        
        // برگشت به منوی قبلی
        if (state.history.length > 0) {
            const parentId = state.history.pop();
            const parent = await BotMenu.findByPk(parentId);
            if (parent) {
                const parentChildren = await getChildren(parent.id);
                const keyboard = buildKeyboard(parentChildren, state.history.length > 0);
                await bot.sendMessage(chatId, parent.content || parent.text + ':', keyboard);
                state.currentMenuId = parent.id;
                userState.set(chatId, state);
            }
        }
    }
    return true;
}

// ============= رویدادها =============

bot.onText(/\/start/, async (msg) => {
    const chatId = msg.chat.id;
    const root = await getRootMenu();
    
    const welcome = await getMessage('welcome_new') || 'به ربات خوش آمدید';
    await bot.sendMessage(chatId, welcome);
    
    if (root) {
        const children = await getChildren(root.id);
        const keyboard = buildKeyboard(children, false);
        await bot.sendMessage(chatId, root.content || 'منوی اصلی:', keyboard);
        userState.set(chatId, { history: [], currentMenuId: root.id });
    }
});

bot.onText(/\/menu/, async (msg) => {
    const chatId = msg.chat.id;
    const root = await getRootMenu();
    if (root) {
        const children = await getChildren(root.id);
        const keyboard = buildKeyboard(children, false);
        const welcomeBack = await getMessage('welcome_return') || 'منوی اصلی:';
        await bot.sendMessage(chatId, welcomeBack, keyboard);
        userState.set(chatId, { history: [], currentMenuId: root.id });
    }
});

bot.onText(/🔙 بازگشت/, async (msg) => {
    const chatId = msg.chat.id;
    const state = userState.get(chatId);
    
    if (state && state.history.length > 0) {
        const parentId = state.history.pop();
        const parent = await BotMenu.findByPk(parentId);
        if (parent) {
            const children = await getChildren(parent.id);
            const keyboard = buildKeyboard(children, state.history.length > 0);
            await bot.sendMessage(chatId, parent.content || parent.text + ':', keyboard);
            state.currentMenuId = parent.id;
            userState.set(chatId, state);
        }
    } else {
        // برگشت به اصلی
        const root = await getRootMenu();
        if (root) {
            const children = await getChildren(root.id);
            const keyboard = buildKeyboard(children, false);
            await bot.sendMessage(chatId, 'منوی اصلی:', keyboard);
            userState.set(chatId, { history: [], currentMenuId: root.id });
        }
    }
});

bot.on('message', async (msg) => {
    if (msg.text && !msg.text.startsWith('/') && !msg.text.startsWith('🔙')) {
        const chatId = msg.chat.id;
        const text = msg.text.replace(/[🔹🔸📚💹👤🏠]/g, '').trim();
        
        const menu = await BotMenu.findOne({ where: { text, isActive: true } });
        if (!menu) {
            const root = await getRootMenu();
            if (root) {
                const children = await getChildren(root.id);
                const keyboard = buildKeyboard(children, false);
                await bot.sendMessage(chatId, 'لطفاً از دکمه‌های منو استفاده کنید.', keyboard);
            }
            return;
        }
        
        const state = userState.get(chatId) || { history: [] };
        if (state.currentMenuId) {
            state.history.push(state.currentMenuId);
        }
        userState.set(chatId, state);
        
        await showMenu(chatId, menu.id);
    }
});

bot.getMe().then(info => {
    console.log('🤖 ربات @' + info.username + ' فعال شد');
});

module.exports = { bot };