// ============= controllers/webappController.js =============
// کنترلر مدیریت وب‌اپ (صفحات، منوها، مدیا، فرم‌ها، تنظیمات)

const { 
  WebappPage, 
  WebappMenu, 
  WebappMedia, 
  WebappElement,
  WebappForm, 
  WebappFormEntry, 
  WebappUser, 
  WebappSetting,
  Admin
} = require('../models');
const { Op } = require('sequelize');
const path = require('path');
const fs = require('fs');

// ============= صفحه اصلی مدیریت وب‌اپ =============
// نمایش آمار و اطلاعات کلی
const webappIndex = async (req, res) => {
  try {
    // دریافت آمار کلی از تمام بخش‌ها
    const [pages, menus, media, forms, users] = await Promise.all([
      WebappPage.count(),
      WebappMenu.count({ where: { isActive: true } }),
      WebappMedia.count(),
      WebappForm.count(),
      WebappUser.count()
    ]);

    // دریافت آخرین صفحات ایجاد شده
    const recentPages = await WebappPage.findAll({
      limit: 5,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'title_fa', 'slug', 'isActive', 'createdAt']
    });

    // دریافت آخرین فایل‌های آپلود شده
    const recentMedia = await WebappMedia.findAll({
      limit: 8,
      order: [['createdAt', 'DESC']],
      attributes: ['id', 'filename', 'url', 'type', 'size']
    });

    res.render('webapp', {
      title: 'مدیریت وب‌اپ',
      user: req.session.adminUsername,
      activePage: 'webapp',
      stats: { pages, menus, media, forms, users },
      recentPages,
      recentMedia,
      success: req.query.success,
      error: req.query.error
    });
  } catch (error) {
    console.error('❌ Webapp index error:', error);
    res.status(500).render('error', {
      title: 'خطا',
      message: 'خطا در بارگذاری صفحه مدیریت وب‌اپ',
      error: process.env.NODE_ENV === 'development' ? error : {},
      user: req.session.adminUsername
    });
  }
};

// ============= مدیریت صفحات =============

// دریافت لیست تمام صفحات
const getPages = async (req, res) => {
  try {
    
    const pages = await WebappPage.findAll({
      order: [['isHomepage', 'DESC'], ['order', 'ASC'], ['createdAt', 'DESC']]
    });
    
    res.json({ success: true, data: pages });
  } catch (error) {
    console.error('🔴 ERROR in getPages:', error);
    console.error('🔴 Error stack:', error.stack);
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت اطلاعات یک صفحه با آیدی
const getPageById = async (req, res) => {
  try {
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد صفحه جدید
const createPage = async (req, res) => {
  try {
    const pageData = {
      title_fa: req.body.title_fa || '',
      title_en: req.body.title_en || '',
      title_ar: req.body.title_ar || '',
      slug: req.body.slug || '',
      content_fa: req.body.content_fa || '[]',
      content_en: req.body.content_en || '[]',
      content_ar: req.body.content_ar || '[]',
      meta_title_fa: req.body.meta_title_fa || '',
      meta_title_en: req.body.meta_title_en || '',
      meta_title_ar: req.body.meta_title_ar || '',
      meta_description_fa: req.body.meta_description_fa || '',
      meta_description_en: req.body.meta_description_en || '',
      meta_description_ar: req.body.meta_description_ar || '',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true,
      isHomepage: req.body.isHomepage || false,
      order: req.body.order || 0
    };

    // اگر صفحه اصلی انتخاب شده، بقیه صفحات رو از حالت اصلی خارج کن
    if (pageData.isHomepage) {
      await WebappPage.update({ isHomepage: false }, { where: { isHomepage: true } });
    }

    const page = await WebappPage.create(pageData);
    res.status(201).json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش صفحه
const updatePage = async (req, res) => {
  try {
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }

    const updateData = {
      title_fa: req.body.title_fa !== undefined ? req.body.title_fa : page.title_fa,
      title_en: req.body.title_en !== undefined ? req.body.title_en : page.title_en,
      title_ar: req.body.title_ar !== undefined ? req.body.title_ar : page.title_ar,
      slug: req.body.slug !== undefined ? req.body.slug : page.slug,
      content_fa: req.body.content_fa !== undefined ? req.body.content_fa : page.content_fa,
      content_en: req.body.content_en !== undefined ? req.body.content_en : page.content_en,
      content_ar: req.body.content_ar !== undefined ? req.body.content_ar : page.content_ar,
      meta_title_fa: req.body.meta_title_fa !== undefined ? req.body.meta_title_fa : page.meta_title_fa,
      meta_title_en: req.body.meta_title_en !== undefined ? req.body.meta_title_en : page.meta_title_en,
      meta_title_ar: req.body.meta_title_ar !== undefined ? req.body.meta_title_ar : page.meta_title_ar,
      meta_description_fa: req.body.meta_description_fa !== undefined ? req.body.meta_description_fa : page.meta_description_fa,
      meta_description_en: req.body.meta_description_en !== undefined ? req.body.meta_description_en : page.meta_description_en,
      meta_description_ar: req.body.meta_description_ar !== undefined ? req.body.meta_description_ar : page.meta_description_ar,
      isActive: req.body.isActive !== undefined ? req.body.isActive : page.isActive,
      isHomepage: req.body.isHomepage !== undefined ? req.body.isHomepage : page.isHomepage,
      order: req.body.order !== undefined ? req.body.order : page.order
    };

    // اگر صفحه اصلی انتخاب شده، بقیه صفحات رو از حالت اصلی خارج کن
    if (updateData.isHomepage && !page.isHomepage) {
      await WebappPage.update({ isHomepage: false }, { where: { isHomepage: true } });
    }

    await page.update(updateData);
    res.json({ success: true, data: page });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف صفحه
const deletePage = async (req, res) => {
  try {
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }

    // اگر صفحه اصلی است، اجازه حذف نده
    if (page.isHomepage) {
      return res.status(400).json({ success: false, error: 'صفحه اصلی را نمی‌توان حذف کرد. ابتدا صفحه دیگری را به عنوان اصلی انتخاب کنید.' });
    }

    await page.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// تغییر وضعیت صفحه (فعال/غیرفعال)
const togglePageStatus = async (req, res) => {
  try {
    const page = await WebappPage.findByPk(req.params.id);
    if (!page) {
      return res.status(404).json({ success: false, error: 'صفحه یافت نشد' });
    }

    // اگر صفحه اصلی است، نمی‌توان غیرفعالش کرد
    if (page.isHomepage && page.isActive) {
      return res.status(400).json({ success: false, error: 'صفحه اصلی را نمی‌توان غیرفعال کرد' });
    }

    page.isActive = !page.isActive;
    await page.save();
    res.json({ success: true, isActive: page.isActive });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= کتابخانه مدیا =============

// دریافت لیست فایل‌ها
const getMedia = async (req, res) => {
  try {
    const { type, page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const where = {};
    if (type) where.type = type;

    const { count, rows } = await WebappMedia.findAndCountAll({
      where,
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// آپلود فایل جدید
const uploadMedia = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'فایلی آپلود نشده است' });
    }

    const file = req.file;
    const fileUrl = `/uploads/${file.filename}`;
    
    // تشخیص نوع فایل
    let type = 'other';
    if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.startsWith('video/')) type = 'video';
    else if (file.mimetype.startsWith('audio/')) type = 'audio';
    else if (file.mimetype.includes('pdf') || file.mimetype.includes('document')) type = 'document';

    // دریافت ابعاد برای تصاویر
    let width = 0, height = 0;
    if (type === 'image') {
      // اینجا می‌توانید با sharp یا gm ابعاد را بدست آورید
      // برای سادگی، فعلاً مقدار پیش‌فرض می‌گذاریم
    }

    const media = await WebappMedia.create({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      url: fileUrl,
      type: type,
      mimeType: file.mimetype,
      size: file.size,
      width,
      height,
      uploadedBy: req.session.adminId || null
    });

    res.status(201).json({ success: true, data: media });
  } catch (error) {
    console.error('❌ Upload error:', error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف فایل
const deleteMedia = async (req, res) => {
  try {
    const media = await WebappMedia.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, error: 'فایل یافت نشد' });
    }

    // حذف فایل از دیسک
    const filePath = path.join(__dirname, '..', media.path);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    await media.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// به‌روزرسانی اطلاعات فایل (alt, title)
const updateMediaInfo = async (req, res) => {
  try {
    const media = await WebappMedia.findByPk(req.params.id);
    if (!media) {
      return res.status(404).json({ success: false, error: 'فایل یافت نشد' });
    }

    await media.update({
      alt_fa: req.body.alt_fa !== undefined ? req.body.alt_fa : media.alt_fa,
      alt_en: req.body.alt_en !== undefined ? req.body.alt_en : media.alt_en,
      alt_ar: req.body.alt_ar !== undefined ? req.body.alt_ar : media.alt_ar,
      title_fa: req.body.title_fa !== undefined ? req.body.title_fa : media.title_fa,
      title_en: req.body.title_en !== undefined ? req.body.title_en : media.title_en,
      title_ar: req.body.title_ar !== undefined ? req.body.title_ar : media.title_ar
    });

    res.json({ success: true, data: media });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت منوها =============

// دریافت ساختار درختی منوها
const getMenus = async (req, res) => {
  try {
    const { location } = req.query;
    
    const where = { parentId: null };
    if (location) where.location = location;

    const menus = await WebappMenu.findAll({
      where,
      include: [
        { model: WebappPage, as: 'page', attributes: ['id', 'title_fa', 'slug'] },
        { 
          model: WebappMenu, 
          as: 'children',
          include: [
            { model: WebappPage, as: 'page', attributes: ['id', 'title_fa', 'slug'] }
          ],
          order: [['order', 'ASC']]
        }
      ],
      order: [['order', 'ASC']]
    });

    res.json({ success: true, data: menus });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت یک آیتم منو
const getMenuItem = async (req, res) => {
  try {
    const menu = await WebappMenu.findByPk(req.params.id, {
      include: [
        { model: WebappPage, as: 'page' },
        { model: WebappMenu, as: 'parent' }
      ]
    });
    if (!menu) {
      return res.status(404).json({ success: false, error: 'آیتم منو یافت نشد' });
    }
    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد آیتم منو
const createMenu = async (req, res) => {
  try {
    const menuData = {
      title_fa: req.body.title_fa || '',
      title_en: req.body.title_en || '',
      title_ar: req.body.title_ar || '',
      linkType: req.body.linkType || 'page',
      pageId: req.body.pageId || null,
      customUrl_fa: req.body.customUrl_fa || '',
      customUrl_en: req.body.customUrl_en || '',
      customUrl_ar: req.body.customUrl_ar || '',
      parentId: req.body.parentId || null,
      icon: req.body.icon || '',
      target: req.body.target || '_self',
      location: req.body.location || 'header',
      order: req.body.order || 0,
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const menu = await WebappMenu.create(menuData);
    res.status(201).json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش آیتم منو
const updateMenu = async (req, res) => {
  try {
    const menu = await WebappMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'آیتم منو یافت نشد' });
    }

    await menu.update({
      title_fa: req.body.title_fa !== undefined ? req.body.title_fa : menu.title_fa,
      title_en: req.body.title_en !== undefined ? req.body.title_en : menu.title_en,
      title_ar: req.body.title_ar !== undefined ? req.body.title_ar : menu.title_ar,
      linkType: req.body.linkType !== undefined ? req.body.linkType : menu.linkType,
      pageId: req.body.pageId !== undefined ? req.body.pageId : menu.pageId,
      customUrl_fa: req.body.customUrl_fa !== undefined ? req.body.customUrl_fa : menu.customUrl_fa,
      customUrl_en: req.body.customUrl_en !== undefined ? req.body.customUrl_en : menu.customUrl_en,
      customUrl_ar: req.body.customUrl_ar !== undefined ? req.body.customUrl_ar : menu.customUrl_ar,
      parentId: req.body.parentId !== undefined ? req.body.parentId : menu.parentId,
      icon: req.body.icon !== undefined ? req.body.icon : menu.icon,
      target: req.body.target !== undefined ? req.body.target : menu.target,
      location: req.body.location !== undefined ? req.body.location : menu.location,
      order: req.body.order !== undefined ? req.body.order : menu.order,
      isActive: req.body.isActive !== undefined ? req.body.isActive : menu.isActive
    });

    res.json({ success: true, data: menu });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف آیتم منو
const deleteMenu = async (req, res) => {
  try {
    const menu = await WebappMenu.findByPk(req.params.id);
    if (!menu) {
      return res.status(404).json({ success: false, error: 'آیتم منو یافت نشد' });
    }

    // بررسی وجود زیرمنو
    const children = await WebappMenu.count({ where: { parentId: menu.id } });
    if (children > 0) {
      return res.status(400).json({ success: false, error: 'این آیتم دارای زیرمنو است. ابتدا زیرمنوها را حذف کنید.' });
    }

    await menu.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// تغییر ترتیب منوها (Drag & Drop)
const reorderMenus = async (req, res) => {
  try {
    const { items } = req.body; // آرایه‌ای از آیتم‌ها با id و order جدید
    
    for (const item of items) {
      await WebappMenu.update(
        { order: item.order },
        { where: { id: item.id } }
      );
    }
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت فرم‌ها =============

// دریافت لیست فرم‌ها
const getForms = async (req, res) => {
  try {
    const forms = await WebappForm.findAll({
      include: [
        { 
          model: WebappFormEntry, 
          as: 'entries',
          limit: 5,
          order: [['createdAt', 'DESC']]
        }
      ],
      order: [['createdAt', 'DESC']]
    });
    res.json({ success: true, data: forms });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت یک فرم
const getForm = async (req, res) => {
  try {
    const form = await WebappForm.findByPk(req.params.id);
    if (!form) {
      return res.status(404).json({ success: false, error: 'فرم یافت نشد' });
    }
    res.json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد فرم جدید
const createForm = async (req, res) => {
  try {
    const formData = {
      name_fa: req.body.name_fa || '',
      name_en: req.body.name_en || '',
      name_ar: req.body.name_ar || '',
      formConfig: req.body.formConfig || '[]',
      recipientEmail: req.body.recipientEmail || '',
      successMessage_fa: req.body.successMessage_fa || 'پیام شما با موفقیت ارسال شد',
      successMessage_en: req.body.successMessage_en || 'Your message has been sent successfully',
      successMessage_ar: req.body.successMessage_ar || 'تم إرسال رسالتك بنجاح',
      isActive: req.body.isActive !== undefined ? req.body.isActive : true
    };

    const form = await WebappForm.create(formData);
    res.status(201).json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش فرم
const updateForm = async (req, res) => {
  try {
    const form = await WebappForm.findByPk(req.params.id);
    if (!form) {
      return res.status(404).json({ success: false, error: 'فرم یافت نشد' });
    }

    await form.update(req.body);
    res.json({ success: true, data: form });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف فرم
const deleteForm = async (req, res) => {
  try {
    const form = await WebappForm.findByPk(req.params.id);
    if (!form) {
      return res.status(404).json({ success: false, error: 'فرم یافت نشد' });
    }

    // حذف تمام ورودی‌های مرتبط
    await WebappFormEntry.destroy({ where: { formId: form.id } });
    await form.destroy();
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت ورودی‌های یک فرم
const getFormEntries = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await WebappFormEntry.findAndCountAll({
      where: { formId: req.params.id },
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    // علامت‌گذاری به عنوان خوانده شده
    await WebappFormEntry.update(
      { isRead: true },
      { where: { formId: req.params.id, isRead: false } }
    );

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف یک ورودی
const deleteFormEntry = async (req, res) => {
  try {
    const entry = await WebappFormEntry.findByPk(req.params.entryId);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'ورودی یافت نشد' });
    }
    await entry.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت تنظیمات =============

// دریافت تنظیمات
const getSettings = async (req, res) => {
  try {
    const settings = await WebappSetting.findAll({
      order: [['category', 'ASC'], ['key', 'ASC']]
    });

    // دسته‌بندی تنظیمات
    const categorized = {};
    settings.forEach(setting => {
      if (!categorized[setting.category]) {
        categorized[setting.category] = [];
      }
      categorized[setting.category].push(setting);
    });

    res.json({ success: true, data: categorized });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// به‌روزرسانی تنظیمات
const updateSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    
    for (const item of settings) {
      await WebappSetting.upsert({
        key: item.key,
        value_fa: item.value_fa || '',
        value_en: item.value_en || '',
        value_ar: item.value_ar || '',
        type: item.type || 'text',
        category: item.category || 'general'
      });
    }
    
    res.json({ success: true, message: 'تنظیمات با موفقیت ذخیره شد' });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت تنظیمات خاص (برای استفاده عمومی)
const getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    const setting = await WebappSetting.findOne({ where: { key } });
    if (!setting) {
      return res.status(404).json({ success: false, error: 'تنظیم یافت نشد' });
    }
    res.json({ success: true, data: setting });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت المان‌ها =============

// دریافت لیست المان‌ها
const getElements = async (req, res) => {
  try {
    const elements = await WebappElement.findAll({
      where: { isActive: true },
      order: [['category', 'ASC'], ['name_fa', 'ASC']]
    });
    res.json({ success: true, data: elements });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ایجاد المان جدید
const createElement = async (req, res) => {
  try {
    const element = await WebappElement.create(req.body);
    res.status(201).json({ success: true, data: element });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ویرایش المان
const updateElement = async (req, res) => {
  try {
    const element = await WebappElement.findByPk(req.params.id);
    if (!element) {
      return res.status(404).json({ success: false, error: 'المان یافت نشد' });
    }
    await element.update(req.body);
    res.json({ success: true, data: element });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// حذف المان
const deleteElement = async (req, res) => {
  try {
    const element = await WebappElement.findByPk(req.params.id);
    if (!element) {
      return res.status(404).json({ success: false, error: 'المان یافت نشد' });
    }
    await element.destroy();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============= مدیریت کاربران وب‌اپ =============

// دریافت لیست کاربران
const getUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const offset = (page - 1) * limit;

    const { count, rows } = await WebappUser.findAndCountAll({
      limit: parseInt(limit),
      offset: parseInt(offset),
      order: [['createdAt', 'DESC']]
    });

    res.json({
      success: true,
      data: rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: count,
        pages: Math.ceil(count / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// دریافت اطلاعات یک کاربر
const getUser = async (req, res) => {
  try {
    const user = await WebappUser.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }
    res.json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// تغییر وضعیت کاربر
const toggleUserStatus = async (req, res) => {
  try {
    const user = await WebappUser.findByPk(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'کاربر یافت نشد' });
    }
    user.isActive = !user.isActive;
    await user.save();
    res.json({ success: true, isActive: user.isActive });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

module.exports = {
  // صفحه اصلی
  webappIndex,
  
  // صفحات
  getPages,
  getPageById,
  createPage,
  updatePage,
  deletePage,
  togglePageStatus,
  
  // مدیا
  getMedia,
  uploadMedia,
  deleteMedia,
  updateMediaInfo,
  
  // منوها
  getMenus,
  getMenuItem,
  createMenu,
  updateMenu,
  deleteMenu,
  reorderMenus,
  
  // فرم‌ها
  getForms,
  getForm,
  createForm,
  updateForm,
  deleteForm,
  getFormEntries,
  deleteFormEntry,
  
  // تنظیمات
  getSettings,
  updateSettings,
  getSettingByKey,
  
  // المان‌ها
  getElements,
  createElement,
  updateElement,
  deleteElement,
  
  // کاربران
  getUsers,
  getUser,
  toggleUserStatus
};