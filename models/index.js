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

Admin.prototype.validatePassword = async function (password) {
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
// این مدل برای ذخیره تمام صفحات وب‌اپ استفاده می‌شود
const WebappPage = sequelize.define('WebappPage', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات پایه صفحه
  title_fa: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
  title_en: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
  title_ar: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },

  // آدرس یکتای صفحه
  slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },

  // محتوای صفحه (JSON برای ذخیره ساختار المان‌ها)
  content_fa: { type: Sequelize.TEXT, defaultValue: '[]' },
  content_en: { type: Sequelize.TEXT, defaultValue: '[]' },
  content_ar: { type: Sequelize.TEXT, defaultValue: '[]' },

  // تنظیمات سئو
  meta_title_fa: { type: Sequelize.STRING(200), defaultValue: '' },
  meta_title_en: { type: Sequelize.STRING(200), defaultValue: '' },
  meta_title_ar: { type: Sequelize.STRING(200), defaultValue: '' },
  meta_description_fa: { type: Sequelize.TEXT, defaultValue: '' },
  meta_description_en: { type: Sequelize.TEXT, defaultValue: '' },
  meta_description_ar: { type: Sequelize.TEXT, defaultValue: '' },

  // وضعیت و تنظیمات
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  isHomepage: { type: Sequelize.BOOLEAN, defaultValue: false }, // صفحه اصلی سایت
  template: { type: Sequelize.STRING(50), defaultValue: 'default' },
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  viewCount: { type: Sequelize.INTEGER, defaultValue: 0 }

}, {
  timestamps: true,
  indexes: [
    { fields: ['slug'] },
    { fields: ['isHomepage'] },
    { fields: ['isActive'] }
  ]
});

// ============= مدل WebappMenu (منوی وب‌اپ) =============
// این مدل برای مدیریت منوهای چندزبانه سایت استفاده می‌شود
const WebappMenu = sequelize.define('WebappMenu', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // عنوان منو به سه زبان
  title_fa: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
  title_en: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
  title_ar: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },

  // نوع لینک: داخلی یا خارجی
  linkType: { type: Sequelize.ENUM('page', 'custom'), defaultValue: 'page' },

  // اگر لینک داخلی به صفحه باشد
  pageId: { type: Sequelize.INTEGER, defaultValue: null },

  // اگر لینک خارجی یا سفارشی باشد
  customUrl_fa: { type: Sequelize.STRING(500), defaultValue: '' },
  customUrl_en: { type: Sequelize.STRING(500), defaultValue: '' },
  customUrl_ar: { type: Sequelize.STRING(500), defaultValue: '' },

  // ساختار سلسله مراتبی
  parentId: { type: Sequelize.INTEGER, defaultValue: null },

  // تنظیمات ظاهری
  icon: { type: Sequelize.STRING(50), defaultValue: '' },
  target: { type: Sequelize.ENUM('_self', '_blank'), defaultValue: '_self' },

  // موقعیت منو
  location: { type: Sequelize.ENUM('header', 'footer', 'sidebar', 'mobile'), defaultValue: 'header' },

  // ترتیب و وضعیت
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }

}, {
  timestamps: true,
  indexes: [
    { fields: ['location'] },
    { fields: ['parentId'] },
    { fields: ['isActive'] }
  ]
});

// ============= مدل WebappMedia (کتابخانه رسانه) =============
// این مدل برای مدیریت فایل‌های آپلود شده استفاده می‌شود
const WebappMedia = sequelize.define('WebappMedia', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات فایل
  filename: { type: Sequelize.STRING(500), allowNull: false },
  originalName: { type: Sequelize.STRING(500), allowNull: false },
  path: { type: Sequelize.STRING(500), allowNull: false },
  url: { type: Sequelize.STRING(500), allowNull: false },

  // نوع فایل
  type: { type: Sequelize.ENUM('image', 'video', 'audio', 'document', 'other'), allowNull: false },
  mimeType: { type: Sequelize.STRING(100), allowNull: false },
  size: { type: Sequelize.INTEGER, allowNull: false }, // حجم بر حسب بایت

  // اطلاعات اختصاصی
  width: { type: Sequelize.INTEGER, defaultValue: 0 }, // برای تصاویر
  height: { type: Sequelize.INTEGER, defaultValue: 0 }, // برای تصاویر
  duration: { type: Sequelize.INTEGER, defaultValue: 0 }, // برای ویدئو و صوت

  // متن جایگزین به سه زبان
  alt_fa: { type: Sequelize.STRING(200), defaultValue: '' },
  alt_en: { type: Sequelize.STRING(200), defaultValue: '' },
  alt_ar: { type: Sequelize.STRING(200), defaultValue: '' },

  // عنوان به سه زبان
  title_fa: { type: Sequelize.STRING(200), defaultValue: '' },
  title_en: { type: Sequelize.STRING(200), defaultValue: '' },
  title_ar: { type: Sequelize.STRING(200), defaultValue: '' },

  // آمار استفاده
  uploadedBy: { type: Sequelize.INTEGER, defaultValue: null },
  usedCount: { type: Sequelize.INTEGER, defaultValue: 0 }

}, {
  timestamps: true,
  indexes: [
    { fields: ['type'] },
    { fields: ['uploadedBy'] }
  ]
});

// ============= مدل WebappElement (المان‌های قابل استفاده) =============
// این مدل برای تعریف المان‌های قابل استفاده در صفحه اصلی است
const WebappElement = sequelize.define('WebappElement', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // نام المان به سه زبان
  name_fa: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
  name_en: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },
  name_ar: { type: Sequelize.STRING(100), allowNull: false, defaultValue: '' },

  // نوع المان
  type: {
    type: Sequelize.ENUM(
      'text', 'image', 'video', 'gallery', 'slider',
      'button', 'card', 'hero', 'feature', 'testimonial',
      'contact', 'social', 'form', 'custom'
    ), allowNull: false
  },

  // کد HTML پیش‌فرض المان
  defaultHtml: { type: Sequelize.TEXT, defaultValue: '' },

  // تنظیمات پیش‌فرض (JSON)
  defaultConfig: { type: Sequelize.TEXT, defaultValue: '{}' },

  // تصویر پیش‌نمایش
  thumbnail: { type: Sequelize.STRING(500), defaultValue: '' },

  // دسته‌بندی
  category: { type: Sequelize.STRING(50), defaultValue: 'general' },

  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }

}, { timestamps: true });

// ============= مدل WebappForm (فرم‌ها) =============
// این مدل برای تعریف فرم‌های تماس، ثبت‌نام و غیره است
const WebappForm = sequelize.define('WebappForm', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // نام فرم به سه زبان
  name_fa: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
  name_en: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },
  name_ar: { type: Sequelize.STRING(200), allowNull: false, defaultValue: '' },

  // ساختار فرم (JSON)
  formConfig: { type: Sequelize.TEXT, defaultValue: '[]' },

  // تنظیمات
  recipientEmail: { type: Sequelize.STRING(200), defaultValue: '' },
  successMessage_fa: { type: Sequelize.TEXT, defaultValue: 'پیام شما با موفقیت ارسال شد' },
  successMessage_en: { type: Sequelize.TEXT, defaultValue: 'Your message has been sent successfully' },
  successMessage_ar: { type: Sequelize.TEXT, defaultValue: 'تم إرسال رسالتك بنجاح' },

  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true }

}, { timestamps: true });

// ============= مدل WebappFormEntry (پاسخ‌های فرم) =============
// این مدل برای ذخیره پاسخ‌های دریافتی از فرم‌ها است
const WebappFormEntry = sequelize.define('WebappFormEntry', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  formId: { type: Sequelize.INTEGER, allowNull: false },
  data: { type: Sequelize.TEXT, allowNull: false }, // JSON

  // اطلاعات فنی
  ip: { type: Sequelize.STRING(50), defaultValue: '' },
  userAgent: { type: Sequelize.TEXT, defaultValue: '' },

  // وضعیت خوانده شدن
  isRead: { type: Sequelize.BOOLEAN, defaultValue: false }

}, { timestamps: true });

// ============= مدل WebappUser (کاربران وب‌اپ) =============
// این مدل برای کاربرانی که در وب‌اپ ثبت‌نام می‌کنند است
const WebappUser = sequelize.define('WebappUser', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات تماس
  email: { type: Sequelize.STRING(100), unique: true, allowNull: false },
  phone: { type: Sequelize.STRING(20), unique: true, allowNull: false },

  // رمز عبور (اختیاری)
  password: { type: Sequelize.STRING(255), defaultValue: '' },

  // نام به سه زبان
  first_name_fa: { type: Sequelize.STRING(100), defaultValue: '' },
  last_name_fa: { type: Sequelize.STRING(100), defaultValue: '' },
  first_name_en: { type: Sequelize.STRING(100), defaultValue: '' },
  last_name_en: { type: Sequelize.STRING(100), defaultValue: '' },
  first_name_ar: { type: Sequelize.STRING(100), defaultValue: '' },
  last_name_ar: { type: Sequelize.STRING(100), defaultValue: '' },

  // تنظیمات
  avatar: { type: Sequelize.STRING(500), defaultValue: '' },
  language: { type: Sequelize.ENUM('fa', 'en', 'ar'), defaultValue: 'fa' },

  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  lastLogin: { type: Sequelize.DATE, defaultValue: null },
  emailVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
  phoneVerified: { type: Sequelize.BOOLEAN, defaultValue: false }

}, { timestamps: true });

// ============= مدل WebappSetting (تنظیمات وب‌اپ) =============
// این مدل برای تنظیمات کلی سایت استفاده می‌شود
const WebappSetting = sequelize.define('WebappSetting', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // کلید تنظیم
  key: { type: Sequelize.STRING(100), unique: true, allowNull: false },

  // مقادیر به سه زبان
  value_fa: { type: Sequelize.TEXT, defaultValue: '' },
  value_en: { type: Sequelize.TEXT, defaultValue: '' },
  value_ar: { type: Sequelize.TEXT, defaultValue: '' },

  // نوع داده
  type: { type: Sequelize.ENUM('text', 'image', 'color', 'number', 'boolean'), defaultValue: 'text' },

  // دسته‌بندی
  category: { type: Sequelize.STRING(50), defaultValue: 'general' }

}, {
  timestamps: true,
  indexes: [
    { fields: ['key'] },
    { fields: ['category'] }
  ]
});

// ============= مدل Broker (بروکرها) =============
const Broker = sequelize.define('Broker', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات پایه
  name: { type: Sequelize.STRING(100), allowNull: false },
  slug: { type: Sequelize.STRING(100), allowNull: false, unique: true },
  logo: { type: Sequelize.STRING(500), defaultValue: '' },

  // اطلاعات بروکر
  foundedYear: { type: Sequelize.INTEGER }, // سال تأسیس
  usersCount: { type: Sequelize.STRING(50), defaultValue: '۰' }, // تعداد کاربران (مثلاً "+۵۰۰٬۰۰۰")

  // رتبه‌بندی
  rating: { type: Sequelize.FLOAT, defaultValue: 0 }, // امتیاز (۰ تا ۵)
  ratingCount: { type: Sequelize.INTEGER, defaultValue: 0 }, // تعداد رأی‌دهندگان

  // رگوله‌ها (به صورت JSON)
  regulations: { type: Sequelize.TEXT, defaultValue: '[]' }, // آرایه‌ای از رگوله‌ها

  // توضیحات
  description_fa: { type: Sequelize.TEXT, defaultValue: '' },
  description_en: { type: Sequelize.TEXT, defaultValue: '' },
  description_ar: { type: Sequelize.TEXT, defaultValue: '' },

  // ویژگی‌ها (اسپرد، اهرم، حداقل واریز و...)
  spread: { type: Sequelize.STRING(50), defaultValue: '' }, // مثلاً "از ۰.۰ پیپ"
  leverage: { type: Sequelize.STRING(50), defaultValue: '' }, // مثلاً "۱:۱۰۰۰"
  minDeposit: { type: Sequelize.STRING(50), defaultValue: '' }, // حداقل واریز

  // لینک‌ها
  website: { type: Sequelize.STRING(500), defaultValue: '' },
  registerLink: { type: Sequelize.STRING(500), defaultValue: '' },

  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false }, // بروکر ویژه
  order: { type: Sequelize.INTEGER, defaultValue: 0 } // ترتیب نمایش

}, { timestamps: true });

// ============= مدل EducationalContent (محتوای آموزشی) =============
const EducationalContent = sequelize.define('EducationalContent', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات پایه
  title_fa: { type: Sequelize.STRING(200), allowNull: false },
  title_en: { type: Sequelize.STRING(200), allowNull: false },
  title_ar: { type: Sequelize.STRING(200), allowNull: false },

  slug: { type: Sequelize.STRING(100), allowNull: false },

  // دسته‌بندی
  category: { type: Sequelize.ENUM('basic', 'strategy', 'technical', 'fundamental'), allowNull: false },

  // محتوا
  content_fa: { type: Sequelize.TEXT('long'), defaultValue: '' },
  content_en: { type: Sequelize.TEXT('long'), defaultValue: '' },
  content_ar: { type: Sequelize.TEXT('long'), defaultValue: '' },

  // خلاصه
  excerpt_fa: { type: Sequelize.TEXT, defaultValue: '' },
  excerpt_en: { type: Sequelize.TEXT, defaultValue: '' },
  excerpt_ar: { type: Sequelize.TEXT, defaultValue: '' },

  // تصویر شاخص
  featuredImage: { type: Sequelize.STRING(500), defaultValue: '' },

  // ترتیب و وضعیت
  order: { type: Sequelize.INTEGER, defaultValue: 0 },
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  viewCount: { type: Sequelize.INTEGER, defaultValue: 0 }

}, { timestamps: true });

// ============= مدل MarketIndex (شاخص‌های بازار) =============
const MarketIndex = sequelize.define('MarketIndex', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // اطلاعات پایه
  symbol: { type: Sequelize.STRING(50), allowNull: false, unique: true }, // مثلاً XAUUSD
  name_fa: { type: Sequelize.STRING(100), allowNull: false },
  name_en: { type: Sequelize.STRING(100), allowNull: false },
  name_ar: { type: Sequelize.STRING(100), allowNull: false },

  // نوع شاخص
  type: { type: Sequelize.ENUM('forex', 'commodity', 'crypto', 'index', 'agricultural'), allowNull: false },

  // قیمت‌ها
  price: { type: Sequelize.STRING(50), defaultValue: '۰' }, // قیمت فعلی
  previousPrice: { type: Sequelize.STRING(50), defaultValue: '۰' }, // قیمت قبلی
  change: { type: Sequelize.FLOAT, defaultValue: 0 }, // تغییر درصدی

  // لینک چارت TradingView
  tradingViewUrl: { type: Sequelize.STRING(500), defaultValue: '' },

  // وضعیت
  isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
  isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false }, // نمایش در صفحه اصلی
  order: { type: Sequelize.INTEGER, defaultValue: 0 }

}, { timestamps: true });

// ============= مدل SiteSettings (تنظیمات سایت) =============
const SiteSettings = sequelize.define('SiteSettings', {
  id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },

  // کلید تنظیم
  key: { type: Sequelize.STRING(100), unique: true, allowNull: false },

  // مقادیر به سه زبان
  value_fa: { type: Sequelize.TEXT, defaultValue: '' },
  value_en: { type: Sequelize.TEXT, defaultValue: '' },
  value_ar: { type: Sequelize.TEXT, defaultValue: '' },

  // نوع داده (برای نمایش در پنل)
  type: { type: Sequelize.ENUM('text', 'textarea', 'image', 'color', 'number', 'boolean', 'url'), defaultValue: 'text' },

  // دسته‌بندی
  category: { type: Sequelize.ENUM('general', 'logo', 'contact', 'social', 'footer'), defaultValue: 'general' },

  // توضیحات (برای راهنمایی در پنل)
  description: { type: Sequelize.STRING(500), defaultValue: '' }

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

      const mainMenu = await BotMenu.create({
        text: 'منوی اصلی',
        emoji: '🏠',
        content: 'لطفاً یکی از گزینه‌های زیر را انتخاب کنید:',
        order: 1
      });

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
        { name: 'دریافت درس‌ها', path: '/api/lessons', method: 'GET', description: 'دریافت لیست تمام درس‌ها', category: 'lessons', requiresAuth: false },
        { name: 'دریافت درس', path: '/api/lessons/:id', method: 'GET', description: 'دریافت اطلاعات یک درس', category: 'lessons', requiresAuth: false },
        { name: 'دریافت بروکرها', path: '/api/brokers', method: 'GET', description: 'دریافت لیست بروکرها', category: 'brokers', requiresAuth: false },
        { name: 'دریافت بروکر', path: '/api/brokers/:id', method: 'GET', description: 'دریافت اطلاعات یک بروکر', category: 'brokers', requiresAuth: false },
        { name: 'دریافت رویدادها', path: '/api/events', method: 'GET', description: 'دریافت لیست رویدادها', category: 'events', requiresAuth: false },
        { name: 'دریافت رویداد', path: '/api/events/:id', method: 'GET', description: 'دریافت اطلاعات یک رویداد', category: 'events', requiresAuth: false },
        { name: 'آمار داشبورد', path: '/api/dashboard/stats', method: 'GET', description: 'دریافت آمار داشبورد مدیریت', category: 'dashboard', requiresAuth: true, permissions: '["admin"]' },
        { name: 'وضعیت ربات', path: '/api/bot/status', method: 'GET', description: 'بررسی وضعیت ربات', category: 'bot', requiresAuth: true },
        { name: 'دریافت منوها', path: '/api/bot/menus', method: 'GET', description: 'دریافت ساختار منوهای ربات', category: 'bot', requiresAuth: false },
        { name: 'دریافت پیام‌ها', path: '/api/bot/messages', method: 'GET', description: 'دریافت لیست پیام‌های ربات', category: 'bot', requiresAuth: true },
        { name: 'دریافت کاربران ربات', path: '/api/bot/users', method: 'GET', description: 'دریافت لیست کاربران ربات', category: 'bot', requiresAuth: true },
        { name: 'اجرای کوئری', path: '/api/database/query', method: 'POST', description: 'اجرای دستور SQL', category: 'database', requiresAuth: true, permissions: '["admin"]' },
        { name: 'جستجو در داده‌ها', path: '/api/database/search', method: 'POST', description: 'جستجو در جداول', category: 'database', requiresAuth: true, permissions: '["admin"]' },
        { name: 'ثبت‌نام کاربر', path: '/api/user/register', method: 'POST', description: 'ثبت‌نام کاربر جدید', category: 'users', requiresAuth: false },
        { name: 'پروفایل کاربر', path: '/api/user/profile', method: 'GET', description: 'دریافت اطلاعات پروفایل', category: 'users', requiresAuth: true },
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
  EducationalContent,
  MarketIndex,
  SiteSettings,
  Event,
  BotMessage,
  BotMenu,
  BotUser,
  BotUserMessage,
  ApiKey,
  ApiEndpoint,
  ApiLog,
  WebappPage,
  WebappMenu,
  WebappMedia,
  WebappElement,
  WebappForm,
  WebappFormEntry,
  WebappUser,
  WebappSetting,
  syncDatabase
};