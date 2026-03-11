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
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  categoryId: { type: Sequelize.INTEGER }
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

// ============= مدل BotMenu (منوهای ربات) =============
const BotMenu = sequelize.define('BotMenu', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  text: { type: Sequelize.STRING(100), allowNull: false },
  emoji: { type: Sequelize.STRING(10), defaultValue: '🔹' },
  parentId: { type: Sequelize.INTEGER, defaultValue: null },
  content: { type: Sequelize.TEXT },
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

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

// ============= مدل ApiKey (کلیدهای API) =============
const ApiKey = sequelize.define('ApiKey', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(100), allowNull: false },
  key: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  secret: { type: Sequelize.STRING(100), allowNull: false },
  permissions: { type: Sequelize.TEXT, defaultValue: '["read"]' },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  expiresAt: { type: Sequelize.DATE },
  lastUsed: { type: Sequelize.DATE },
  createdBy: { type: Sequelize.INTEGER }
}, { timestamps: true });

// ============= مدل ApiEndpoint (اندپوینت‌های API) =============
const ApiEndpoint = sequelize.define('ApiEndpoint', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: Sequelize.STRING(100), allowNull: false },
  path: { type: Sequelize.STRING(200), allowNull: false },
  method: { type: Sequelize.ENUM('GET', 'POST', 'PUT', 'DELETE', 'PATCH'), allowNull: false },
  description: { type: Sequelize.TEXT },
  category: { type: Sequelize.STRING(50) },
  requiresAuth: { type: Sequelize.BOOLEAN, defaultValue: true },
  permissions: { type: Sequelize.TEXT, defaultValue: '[]' },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
}, { timestamps: true });

// ============= مدل ApiLog (لاگ درخواست‌های API) =============
const ApiLog = sequelize.define('ApiLog', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  apiKeyId: { type: Sequelize.INTEGER },
  endpoint: { type: Sequelize.STRING(200), allowNull: false },
  method: { type: Sequelize.STRING(10), allowNull: false },
  statusCode: { type: Sequelize.INTEGER },
  ip: { type: Sequelize.STRING(50) },
  userAgent: { type: Sequelize.TEXT },
  responseTime: { type: Sequelize.INTEGER }
}, { timestamps: true });


// ============= مدل WebappPage (صفحات وب‌اپ) =============
const WebappPage = sequelize.define('WebappPage', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  // اطلاعات پایه
  title_fa: { type: Sequelize.STRING(200), allowNull: false },
  title_en: { type: Sequelize.STRING(200), allowNull: false },
  title_ar: { type: Sequelize.STRING(200), allowNull: false },
  
  slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  
  // محتوای صفحه (JSON برای ذخیره ساختار المان‌ها)
  content_fa: { type: Sequelize.TEXT('long'), defaultValue: '[]' },
  content_en: { type: Sequelize.TEXT('long'), defaultValue: '[]' },
  content_ar: { type: Sequelize.TEXT('long'), defaultValue: '[]' },
  
  // تنظیمات سئو
  meta_title_fa: { type: Sequelize.STRING(200) },
  meta_title_en: { type: Sequelize.STRING(200) },
  meta_title_ar: { type: Sequelize.STRING(200) },
  meta_description_fa: { type: Sequelize.TEXT },
  meta_description_en: { type: Sequelize.TEXT },
  meta_description_ar: { type: Sequelize.TEXT },
  
  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  isHomepage: { type: Sequelize.BOOLEAN, defaultValue: false }, // صفحه اصلی سایت
  template: { type: Sequelize.STRING(50), defaultValue: 'default' }, // قالب صفحه
  
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  viewCount: { type: Sequelize.INTEGER, defaultValue: 0 }
  
}, { timestamps: true });

// ============= مدل WebappMenu (منوی وب‌اپ) =============
const WebappMenu = sequelize.define('WebappMenu', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  name_fa: { type: Sequelize.STRING(100), allowNull: false },
  name_en: { type: Sequelize.STRING(100), allowNull: false },
  name_ar: { type: Sequelize.STRING(100), allowNull: false },
  
  url: { type: Sequelize.STRING(200) }, // اگر لینک خارجی باشد
  pageId: { type: Sequelize.INTEGER }, // اگر به صفحه داخلی لینک دهد
  parentId: { type: Sequelize.INTEGER, defaultValue: null }, // برای زیرمنو
  
  icon: { type: Sequelize.STRING(50) }, // کلاس آیکون
  target: { type: Sequelize.ENUM('_self', '_blank'), defaultValue: '_self' },
  
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  location: { type: Sequelize.ENUM('header', 'footer', 'sidebar'), defaultValue: 'header' }
  
}, { timestamps: true });

// ============= مدل WebappElement (المان‌های قابل استفاده) =============
const WebappElement = sequelize.define('WebappElement', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  name_fa: { type: Sequelize.STRING(100), allowNull: false },
  name_en: { type: Sequelize.STRING(100), allowNull: false },
  name_ar: { type: Sequelize.STRING(100), allowNull: false },
  
  type: { type: Sequelize.ENUM(
    'text', 'image', 'video', 'audio', 'gallery', 
    'slider', 'form', 'button', 'card', 'grid', 
    'hero', 'feature', 'testimonial', 'contact', 'social'
  ), allowNull: false },
  
  // قالب پیش‌فرض المان (JSON)
  defaultConfig: { type: Sequelize.TEXT, defaultValue: '{}' },
  
  thumbnail: { type: Sequelize.STRING(500) }, // تصویر پیش‌نمایش
  category: { type: Sequelize.STRING(50) }, // دسته‌بندی المان‌ها
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
  
}, { timestamps: true });

// ============= مدل WebappMedia (کتابخانه رسانه) =============
const WebappMedia = sequelize.define('WebappMedia', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  filename: { type: Sequelize.STRING(500), allowNull: false },
  originalName: { type: Sequelize.STRING(500) },
  path: { type: Sequelize.STRING(500), allowNull: false },
  url: { type: Sequelize.STRING(500), allowNull: false },
  
  type: { type: Sequelize.ENUM('image', 'video', 'audio', 'document', 'other'), allowNull: false },
  mimeType: { type: Sequelize.STRING(100) },
  size: { type: Sequelize.INTEGER }, // حجم بر حسب بایت
  
  width: { type: Sequelize.INTEGER }, // برای تصاویر
  height: { type: Sequelize.INTEGER }, // برای تصاویر
  duration: { type: Sequelize.INTEGER }, // برای ویدئو و صوت
  
  alt_fa: { type: Sequelize.STRING(200) },
  alt_en: { type: Sequelize.STRING(200) },
  alt_ar: { type: Sequelize.STRING(200) },
  
  title_fa: { type: Sequelize.STRING(200) },
  title_en: { type: Sequelize.STRING(200) },
  title_ar: { type: Sequelize.STRING(200) },
  
  uploadedBy: { type: Sequelize.INTEGER }, // آیدی ادمین آپلودکننده
  usedCount: { type: Sequelize.INTEGER, defaultValue: 0 }
  
}, { timestamps: true });

// ============= مدل WebappForm (فرم‌ها) =============
const WebappForm = sequelize.define('WebappForm', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  name_fa: { type: Sequelize.STRING(200), allowNull: false },
  name_en: { type: Sequelize.STRING(200), allowNull: false },
  name_ar: { type: Sequelize.STRING(200), allowNull: false },
  
  formConfig: { type: Sequelize.TEXT('long'), defaultValue: '[]' }, // JSON ساختار فرم
  recipientEmail: { type: Sequelize.STRING(200) }, // ایمیل دریافت‌کننده
  successMessage_fa: { type: Sequelize.TEXT },
  successMessage_en: { type: Sequelize.TEXT },
  successMessage_ar: { type: Sequelize.TEXT },
  
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }
  
}, { timestamps: true });

// ============= مدل WebappFormEntry (پاسخ‌های دریافتی فرم‌ها) =============
const WebappFormEntry = sequelize.define('WebappFormEntry', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  formId: { type: Sequelize.INTEGER, allowNull: false },
  data: { type: Sequelize.TEXT('long'), allowNull: false }, // JSON داده‌های ارسالی
  ip: { type: Sequelize.STRING(50) },
  userAgent: { type: Sequelize.TEXT },
  isRead: { type: Sequelize.BOOLEAN, defaultValue: false }
  
}, { timestamps: true });

// ============= مدل WebappUser (کاربران وب‌اپ) =============
const WebappUser = sequelize.define('WebappUser', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  email: { type: Sequelize.STRING(100), unique: true },
  phone: { type: Sequelize.STRING(20), unique: true },
  password: { type: Sequelize.STRING(255) }, // اگر ثبت‌نام با رمز باشد
  
  firstName_fa: { type: Sequelize.STRING(100) },
  lastName_fa: { type: Sequelize.STRING(100) },
  firstName_en: { type: Sequelize.STRING(100) },
  lastName_en: { type: Sequelize.STRING(100) },
  firstName_ar: { type: Sequelize.STRING(100) },
  lastName_ar: { type: Sequelize.STRING(100) },
  
  avatar: { type: Sequelize.STRING(500) },
  language: { type: Sequelize.ENUM('fa', 'en', 'ar'), defaultValue: 'fa' },
  
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  lastLogin: { type: Sequelize.DATE },
  emailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
  phoneVerified: { type: Sequelize.BOOLEAN, defaultValue: false }
  
}, { timestamps: true });

// ============= مدل WebappSetting (تنظیمات کلی وب‌اپ) =============
const WebappSetting = sequelize.define('WebappSetting', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
  
  key: { type: Sequelize.STRING(100), unique: true, allowNull: false },
  value_fa: { type: Sequelize.TEXT },
  value_en: { type: Sequelize.TEXT },
  value_ar: { type: Sequelize.TEXT },
  
  type: { type: Sequelize.ENUM('text', 'image', 'color', 'number', 'boolean'), defaultValue: 'text' },
  category: { type: Sequelize.STRING(50) } // general, social, contact, etc.
  
}, { timestamps: true });


// ============= تعریف ارتباطات =============
Category.hasMany(Lesson, { foreignKey: 'categoryId', as: 'lessons' });
Lesson.belongsTo(Category, { foreignKey: 'categoryId', as: 'category' });

BotMenu.belongsTo(BotMenu, { as: 'parent', foreignKey: 'parentId' });
BotMenu.hasMany(BotMenu, { as: 'children', foreignKey: 'parentId' });

BotUser.hasMany(BotUserMessage, { foreignKey: 'userId', as: 'messages' });
BotUserMessage.belongsTo(BotUser, { foreignKey: 'userId', as: 'user' });

// ارتباطات وب‌اپ
WebappMenu.belongsTo(WebappPage, { foreignKey: 'pageId', as: 'page' });
WebappMenu.belongsTo(WebappMenu, { as: 'parent', foreignKey: 'parentId' });
WebappMenu.hasMany(WebappMenu, { as: 'children', foreignKey: 'parentId' });

WebappForm.hasMany(WebappFormEntry, { foreignKey: 'formId', as: 'entries' });
WebappFormEntry.belongsTo(WebappForm, { foreignKey: 'formId', as: 'form' });

// ارتباط با مدل‌های قبلی (اختیاری)
WebappMedia.belongsTo(Admin, { foreignKey: 'uploadedBy', as: 'uploader' });

// ارتباطات API
ApiKey.hasMany(ApiLog, { foreignKey: 'apiKeyId', as: 'logs' });
ApiLog.belongsTo(ApiKey, { foreignKey: 'apiKeyId', as: 'apiKey' });

// ============= سینک دیتابیس و داده‌های پیش‌فرض =============
const syncDatabase = async () => {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected');
    
    // غیرفعال کردن موقت FOREIGN KEY برای SQLite
    await sequelize.query('PRAGMA foreign_keys = OFF;');
    
    // همگام‌سازی بدون پاک کردن داده‌ها
    await sequelize.sync({ alter: true });
    console.log('✅ Models synced (alter mode)');
    
    // فعال کردن مجدد FOREIGN KEY
    await sequelize.query('PRAGMA foreign_keys = ON;');
    
    // ایجاد ادمین پیش‌فرض (فقط اگر هیچ ادمینی وجود نداشته باشد)
    const adminCount = await Admin.count();
    if (adminCount === 0) {
      await Admin.create({
        username: 'pprofessor',
        password: 'Shh@0012108197',
        role: 'superadmin'
      });
      console.log('✅ Default admin created');
    }
    
    // ایجاد پیام‌های پیش‌فرض (فقط اگر هیچ پیامی وجود نداشته باشد)
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
    
    // ایجاد منوهای پیش‌فرض (فقط اگر هیچ منویی وجود نداشته باشد)
    const menuCount = await BotMenu.count();
    if (menuCount === 0) {
      console.log('📝 Creating default menus...');
      
      // منوی اصلی (بدون parent)
      const mainMenu = await BotMenu.create({
        text: 'منوی اصلی',
        emoji: '🏠',
        content: 'لطفاً یکی از گزینه‌های زیر را انتخاب کنید:',
        order: 1
      });
      
      // زیرمنوها
      await BotMenu.create({
        text: 'دوره‌های آموزشی',
        emoji: '📚',
        parentId: mainMenu.id,
        content: 'دوره‌های آموزشی:\n- مقدماتی\n- پیشرفته\n- تخصصی',
        order: 1
      });
      
      await BotMenu.create({
        text: 'بروکرها',
        emoji: '💹',
        parentId: mainMenu.id,
        content: 'لیست بروکرهای معتبر:',
        order: 2
      });
      
      await BotMenu.create({
        text: 'پروفایل من',
        emoji: '👤',
        parentId: mainMenu.id,
        content: 'اطلاعات پروفایل شما:',
        order: 3
      });
      
      await BotMenu.create({
        text: 'رویدادها',
        emoji: '📅',
        parentId: mainMenu.id,
        content: 'رویدادهای پیش‌رو:',
        order: 4
      });
      
      console.log('✅ Default menus created');
    } else {
      console.log(`📊 Existing menus found: ${menuCount} menu(s) - keeping them`);
    }

// ایجاد اندپوینت‌های پیش‌فرض (فقط اگر هیچ اندپوینتی وجود نداشته باشد)
const endpointCount = await ApiEndpoint.count();
if (endpointCount === 0) {
  console.log('📝 Creating default API endpoints...');
  
  const endpoints = [
    // اندپوینت‌های عمومی
    { name: 'دریافت درس‌ها', path: '/api/lessons', method: 'GET', description: 'دریافت لیست تمام درس‌ها', category: 'lessons', requiresAuth: false },
    { name: 'دریافت درس', path: '/api/lessons/:id', method: 'GET', description: 'دریافت اطلاعات یک درس', category: 'lessons', requiresAuth: false },
    { name: 'دریافت بروکرها', path: '/api/brokers', method: 'GET', description: 'دریافت لیست بروکرها', category: 'brokers', requiresAuth: false },
    { name: 'دریافت بروکر', path: '/api/brokers/:id', method: 'GET', description: 'دریافت اطلاعات یک بروکر', category: 'brokers', requiresAuth: false },
    { name: 'دریافت رویدادها', path: '/api/events', method: 'GET', description: 'دریافت لیست رویدادها', category: 'events', requiresAuth: false },
    { name: 'دریافت رویداد', path: '/api/events/:id', method: 'GET', description: 'دریافت اطلاعات یک رویداد', category: 'events', requiresAuth: false },
    
    // اندپوینت‌های داشبورد (نیازمند احراز هویت)
    { name: 'آمار داشبورد', path: '/api/dashboard/stats', method: 'GET', description: 'دریافت آمار داشبورد مدیریت', category: 'dashboard', requiresAuth: true, permissions: '["admin"]' },
    
    // اندپوینت‌های ربات
    { name: 'وضعیت ربات', path: '/api/bot/status', method: 'GET', description: 'بررسی وضعیت ربات', category: 'bot', requiresAuth: true },
    { name: 'دریافت منوها', path: '/api/bot/menus', method: 'GET', description: 'دریافت ساختار منوهای ربات', category: 'bot', requiresAuth: false },
    { name: 'دریافت پیام‌ها', path: '/api/bot/messages', method: 'GET', description: 'دریافت لیست پیام‌های ربات', category: 'bot', requiresAuth: true },
    { name: 'دریافت کاربران ربات', path: '/api/bot/users', method: 'GET', description: 'دریافت لیست کاربران ربات', category: 'bot', requiresAuth: true },
    
    // اندپوینت‌های مدیریت دیتابیس
    { name: 'اجرای کوئری', path: '/api/database/query', method: 'POST', description: 'اجرای دستور SQL', category: 'database', requiresAuth: true, permissions: '["admin"]' },
    { name: 'جستجو در داده‌ها', path: '/api/database/search', method: 'POST', description: 'جستجو در جداول', category: 'database', requiresAuth: true, permissions: '["admin"]' },
    
    // اندپوینت‌های کاربران
    { name: 'ثبت‌نام کاربر', path: '/api/user/register', method: 'POST', description: 'ثبت‌نام کاربر جدید', category: 'users', requiresAuth: false },
    { name: 'پروفایل کاربر', path: '/api/user/profile', method: 'GET', description: 'دریافت اطلاعات پروفایل', category: 'users', requiresAuth: true },
    
    // اندپوینت تماس
    { name: 'تماس با ما', path: '/api/contact', method: 'POST', description: 'ارسال پیام تماس', category: 'contact', requiresAuth: false }
  ];
  
  for (const ep of endpoints) {
    await ApiEndpoint.create(ep);
  }
  
  console.log(`✅ ${endpoints.length} API endpoints created`);
}
    
  } catch (error) {
    console.error('❌ Database error:', error);
  }
};

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
  ApiKey,        // اضافه شد
  ApiEndpoint,   // اضافه شد
  ApiLog,        // اضافه شد
  syncDatabase 
};