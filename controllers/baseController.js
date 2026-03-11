// ============= توابع کمکی برای کنترلرها =============
// این کنترلر پایه برای مدیریت عملیات CRUD روی تمام مدل‌ها استفاده می‌شود

const baseController = {
  // ============= نمایش لیست آیتم‌ها =============
  // دریافت همه رکوردهای یک مدل و نمایش در صفحه مربوطه
  async getAll(Model, req, res, viewName, title) {
    try {
      const items = await Model.findAll({ 
        order: [['createdAt', 'DESC']] 
      });
      
      res.render(viewName, { 
        title, 
        items,
        error: null,
        user: req.session.adminUsername,
        activePage: req.path.split('/')[2] || 'dashboard' // استخراج نام صفحه از مسیر
      });
    } catch (error) {
      console.error(`❌ خطا در دریافت اطلاعات از مدل ${Model.name}:`, error);
      res.status(500).render('error', {
        title: 'خطا',
        message: 'خطا در دریافت اطلاعات',
        error: process.env.NODE_ENV === 'development' ? error : {},
        user: req.session.adminUsername
      });
    }
  },

  // ============= نمایش فرم ایجاد =============
  // نمایش فرم خالی برای ایجاد رکورد جدید
  createForm(req, res, viewName, title) {
    res.render(viewName, { 
      title, 
      item: null,
      error: null,
      user: req.session.adminUsername,
      activePage: req.path.split('/')[2] || 'dashboard',
      isEdit: false
    });
  },

  // ============= ذخیره آیتم جدید =============
  // ایجاد رکورد جدید در دیتابیس
  async create(Model, req, res, viewName, redirectPath, fields) {
    try {
      const data = {};
      
      // فقط فیلدهای مشخص شده را از req.body استخراج کن
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          data[field] = req.body[field];
        }
      });
      
      // اضافه کردن فیلدهای زمانی به صورت خودکار
      const newItem = await Model.create(data);
      
      console.log(`✅ رکورد جدید در مدل ${Model.name} با ID ${newItem.id} ایجاد شد`);
      res.redirect(redirectPath);
      
    } catch (error) {
      console.error(`❌ خطا در ایجاد رکورد در مدل ${Model.name}:`, error);
      
      res.render(viewName, { 
        title: 'خطا در ایجاد', 
        item: req.body,
        error: error.message || 'خطا در ذخیره اطلاعات',
        user: req.session.adminUsername,
        activePage: req.path.split('/')[2] || 'dashboard',
        isEdit: false
      });
    }
  },

  // ============= نمایش فرم ویرایش =============
  // نمایش فرم با داده‌های موجود برای ویرایش
  async editForm(Model, req, res, viewName, title) {
    try {
      const item = await Model.findByPk(req.params.id);
      
      if (!item) {
        return res.status(404).render('error', {
          title: 'یافت نشد',
          message: 'رکورد مورد نظر یافت نشد',
          error: null,
          user: req.session.adminUsername
        });
      }
      
      res.render(viewName, { 
        title, 
        item,
        error: null,
        user: req.session.adminUsername,
        activePage: req.path.split('/')[2] || 'dashboard',
        isEdit: true
      });
      
    } catch (error) {
      console.error(`❌ خطا در دریافت رکورد برای ویرایش از مدل ${Model.name}:`, error);
      
      res.status(500).render('error', {
        title: 'خطا',
        message: 'خطا در دریافت اطلاعات',
        error: process.env.NODE_ENV === 'development' ? error : {},
        user: req.session.adminUsername
      });
    }
  },

  // ============= به‌روزرسانی آیتم =============
  // ویرایش رکورد موجود در دیتابیس
  async update(Model, req, res, redirectPath, fields) {
    try {
      const item = await Model.findByPk(req.params.id);
      
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          error: 'رکورد مورد نظر یافت نشد' 
        });
      }
      
      // به‌روزرسانی فقط فیلدهای مشخص شده
      fields.forEach(field => {
        if (req.body[field] !== undefined) {
          item[field] = req.body[field];
        }
      });
      
      await item.save();
      
      console.log(`✅ رکورد ID ${item.id} در مدل ${Model.name} به‌روزرسانی شد`);
      
      // اگر درخواست AJAX است، JSON برگردان
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.json({ success: true, item });
      } else {
        res.redirect(redirectPath);
      }
      
    } catch (error) {
      console.error(`❌ خطا در به‌روزرسانی رکورد در مدل ${Model.name}:`, error);
      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(500).json({ 
          success: false, 
          error: error.message || 'خطا در به‌روزرسانی' 
        });
      } else {
        res.redirect(redirectPath);
      }
    }
  },

  // ============= حذف آیتم =============
  // حذف رکورد از دیتابیس
  async delete(Model, req, res, redirectPath) {
    try {
      const item = await Model.findByPk(req.params.id);
      
      if (!item) {
        return res.status(404).json({ 
          success: false, 
          error: 'رکورد مورد نظر یافت نشد' 
        });
      }
      
      await item.destroy();
      
      console.log(`✅ رکورد ID ${req.params.id} از مدل ${Model.name} حذف شد`);
      
      // اگر درخواست AJAX است، JSON برگردان
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.json({ success: true });
      } else {
        res.redirect(redirectPath);
      }
      
    } catch (error) {
      console.error(`❌ خطا در حذف رکورد از مدل ${Model.name}:`, error);
      
      if (req.xhr || req.headers.accept.indexOf('json') > -1) {
        res.status(500).json({ 
          success: false, 
          error: error.message || 'خطا در حذف رکورد' 
        });
      } else {
        res.redirect(redirectPath);
      }
    }
  },

  // ============= دریافت لیست با صفحه‌بندی =============
  // دریافت رکوردها با قابلیت صفحه‌بندی
  async getPaginated(Model, req, res, viewName, title, pageSize = 20) {
    try {
      const page = parseInt(req.query.page) || 1;
      const offset = (page - 1) * pageSize;
      
      const { count, rows } = await Model.findAndCountAll({
        order: [['createdAt', 'DESC']],
        limit: pageSize,
        offset: offset
      });
      
      res.render(viewName, { 
        title, 
        items: rows,
        pagination: {
          page,
          pageSize,
          totalPages: Math.ceil(count / pageSize),
          totalItems: count
        },
        error: null,
        user: req.session.adminUsername,
        activePage: req.path.split('/')[2] || 'dashboard'
      });
      
    } catch (error) {
      console.error(`❌ خطا در دریافت اطلاعات با صفحه‌بندی از مدل ${Model.name}:`, error);
      
      res.status(500).render('error', {
        title: 'خطا',
        message: 'خطا در دریافت اطلاعات',
        error: process.env.NODE_ENV === 'development' ? error : {},
        user: req.session.adminUsername
      });
    }
  }
};

module.exports = baseController;