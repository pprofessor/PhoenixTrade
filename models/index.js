const { Sequelize } = require('sequelize');
const bcrypt = require('bcryptjs');

// ============= اتصال به دیتابیس SQLite =============
const sequelize = new Sequelize({
  dialect: 'sqlite',
  storage: './database.sqlite',
  logging: false
});

// ============= مدل Admin (مدیران سیستم) =============
const Admin = sequelize.define('Admin', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  username: { type: Sequelize.STRING(50), allowNull: false, unique: true },
  password: { type: Sequelize.STRING(255), allowNull: false },
  role: { type: Sequelize.ENUM('superadmin', 'admin'), defaultValue: 'admin' },
  lastLogin: { type: Sequelize.DATE }
}, {
  timestamps: true,
  hooks: {
    beforeCreate: async (admin) => { 
      if (admin.password) admin.password = await bcrypt.hash(admin.password, 10); 
    }
  }
});

// متد بررسی رمز عبور
Admin.prototype.validatePassword = async function(password) {
  return bcrypt.compare(password, this.password);
};

// ============= مدل Category (دسته‌بندی درس‌ها) =============
const Category = sequelize.define('Category', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(100), allowNull: false },
  slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  description: { type: Sequelize.TEXT },
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل Lesson (درس‌ها) =============
const Lesson = sequelize.define('Lesson', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING(200), allowNull: false },
  content: { type: Sequelize.TEXT },
  videoUrl: { type: Sequelize.STRING(500) },
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isFree: { type: Sequelize.BOOLEAN, defaultValue: false },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل Broker (بروکرها) =============
const Broker = sequelize.define('Broker', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(100), allowNull: false },
  logo: { type: Sequelize.STRING(500) },
  description: { type: Sequelize.TEXT },
  pros: { type: Sequelize.TEXT },
  cons: { type: Sequelize.TEXT },
  registerLink: { type: Sequelize.STRING(500) },
  minDeposit: { type: Sequelize.INTEGER },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل Event (رویدادها) =============
const Event = sequelize.define('Event', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  title: { type: Sequelize.STRING(200), allowNull: false },
  description: { type: Sequelize.TEXT },
  eventDate: { type: Sequelize.DATE },
  duration: { type: Sequelize.INTEGER },
  maxParticipants: { type: Sequelize.INTEGER },
  isOnline: { type: Sequelize.BOOLEAN, defaultValue: true },
  link: { type: Sequelize.STRING(500) },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل BotMessage (پیام‌های ربات) =============
const BotMessage = sequelize.define('BotMessage', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  text: { type: Sequelize.TEXT },
  media: { type: Sequelize.STRING(500) },
  buttons: { type: Sequelize.TEXT },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل WebappPage (صفحات وب‌اپ) =============
const WebappPage = sequelize.define('WebappPage', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  title: { type: Sequelize.STRING(200) },
  content: { type: Sequelize.TEXT },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل BotMenu (منوهای ربات) =============
// const BotMenu = sequelize.define('BotMenu', {
//   id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
//   name: { type: Sequelize.STRING(100), allowNull: true }, // نام داخلی منو
//   text: { type: Sequelize.STRING(100), allowNull: false }, // متن نمایشی به کاربر
//   emoji: { type: Sequelize.STRING(10), defaultValue: '🔹' }, // ایموجی کنار منو
//   type: { type: Sequelize.ENUM('main', 'submenu'), defaultValue: 'main' }, // حذف command
//   parentId: { type: Sequelize.INTEGER, defaultValue: null }, // آیدی والد (برای زیرمنوها)
//   order: { type: Sequelize.INTEGER, defaultValue: 0 }, // ترتیب نمایش
//   content: { type: Sequelize.TEXT }, // متن نمایشی وقتی کاربر کلیک میکنه (جدید)
//   apiEndpoint: { type: Sequelize.STRING(500) }, // آدرس API متصل به منو
//   color: { type: Sequelize.STRING(20), defaultValue: '#ffd700' }, // رنگ منو
//   isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
// }, { timestamps: true });
const BotMenu = sequelize.define('BotMenu', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: Sequelize.STRING(100), allowNull: false },
  emoji: { type: Sequelize.STRING(10), defaultValue: '🔹' },
  parentId: { type: Sequelize.INTEGER, defaultValue: null },
  content: { type: Sequelize.TEXT },
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
});

// ارتباطات منوها - فقط یکبار تعریف کن
BotMenu.belongsTo(BotMenu, { as: 'parentMenu', foreignKey: 'parentId' });
BotMenu.hasMany(BotMenu, { as: 'subMenus', foreignKey: 'parentId' });

// ============= مدل BotUser (کاربران ربات) =============
const BotUser = sequelize.define('BotUser', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  telegramId: { type: Sequelize.STRING(50), allowNull: false, unique: true },
  firstName: { type: Sequelize.STRING(100) },
  lastName: { type: Sequelize.STRING(100) },
  username: { type: Sequelize.STRING(100) },
  phone: { type: Sequelize.STRING(20) },
  nationalCode: { type: Sequelize.STRING(20) },
  email: { type: Sequelize.STRING(100) },
  step: { type: Sequelize.STRING(50), defaultValue: 'none' },
  data: { type: Sequelize.TEXT },
  lastInteraction: { type: Sequelize.DATE },
  isBlocked: { type: Sequelize.BOOLEAN, defaultValue: false }
}, { timestamps: true });

// ============= مدل BotUserMessage (پیام‌های کاربران) =============
const BotUserMessage = sequelize.define('BotUserMessage', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { type: Sequelize.INTEGER, allowNull: false },
  message: { type: Sequelize.TEXT },
  response: { type: Sequelize.TEXT },
  type: { type: Sequelize.ENUM('text', 'command', 'callback'), defaultValue: 'text' }
}, { timestamps: true });

// ============= تعریف ارتباطات بین مدل‌ها =============

// ارتباط Lesson با Category
Category.hasMany(Lesson, { as: 'lessons', foreignKey: 'categoryId' });
Lesson.belongsTo(Category, { as: 'category', foreignKey: 'categoryId' });

// ارتباطات منوها (خودارجاعی برای زیرمنوها)
BotMenu.belongsTo(BotMenu, { as: 'parent', foreignKey: 'parentId' });
BotMenu.hasMany(BotMenu, { as: 'submenus', foreignKey: 'parentId' });

// ارتباط پیام‌ها با کاربران
BotUserMessage.belongsTo(BotUser, { foreignKey: 'userId', as: 'user' });
BotUser.hasMany(BotUserMessage, { foreignKey: 'userId', as: 'messages' });

// ============= سینک دیتابیس و ایجاد داده‌های پیش‌فرض =============
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // غیرفعال کردن موقت FOREIGN KEY برای SQLite
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // همگام‌سازی مدل‌ها با force
    await sequelize.sync({ force: true });
    console.log('✅ Models synced');
    
    // فعال کردن مجدد FOREIGN KEY
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    // ایجاد ادمین پیش‌فرض
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'pprofessor',
        password: 'Shh@0012108197',
        role: 'superadmin'
      });
      console.log('✅ Default admin created');
    }
    
    // ایجاد پیام‌های پیش‌فرض
    const messageCount = await BotMessage.count();
    if (messageCount === 0) {
      await BotMessage.create({
        key: 'welcome_new',
        text: 'به ربات خوش آمدید! برای شروع از منوی اصلی استفاده کنید.'
      });
      await BotMessage.create({
        key: 'welcome_return',
        text: 'خوش آمدید! به منوی اصلی برگشتید.'
      });
      console.log('✅ Default messages created');
    }
    
    // ایجاد منوهای پیش‌فرض
    const menuCount = await BotMenu.count();
    if (menuCount === 0) {
      // منوی اصلی
      const mainMenu = await BotMenu.create({
        name: 'main',
        text: 'منوی اصلی',
        emoji: '🏠',
        type: 'main',
        order: 1,
        content: 'لطفاً یکی از گزینه‌های زیر را انتخاب کنید:'
      });
      
      // زیرمنوها
      await BotMenu.create({
        name: 'lessons',
        text: 'دوره‌های آموزشی',
        emoji: '📚',
        type: 'submenu',
        parentId: mainMenu.id,
        order: 1,
        content: 'دوره‌های آموزشی:\n- مقدماتی\n- پیشرفته\n- تخصصی',
        apiEndpoint: '/api/lessons'
      });
      
      await BotMenu.create({
        name: 'brokers',
        text: 'بروکرها',
        emoji: '💹',
        type: 'submenu',
        parentId: mainMenu.id,
        order: 2,
        content: 'لیست بروکرهای معتبر:',
        apiEndpoint: '/api/brokers'
      });
      
      await BotMenu.create({
        name: 'profile',
        text: 'پروفایل من',
        emoji: '👤',
        type: 'submenu',
        parentId: mainMenu.id,
        order: 3,
        content: 'اطلاعات پروفایل شما:',
        apiEndpoint: '/api/profile'
      });
      
      console.log('✅ Default bot menus created');
    }
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
};

// ============= خروجی ماژول‌ها =============
module.exports = { 
  sequelize, 
  Admin, 
  Category,
  Lesson,
  Broker,
  Event,
  BotMessage,
  WebappPage,
  BotMenu,
  BotUser,
  BotUserMessage,
  syncDatabase 
};