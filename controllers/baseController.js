// توابع کمکی برای کنترلرها
const baseController = {
  // نمایش لیست آیتم‌ها
  async getAll(Model, req, res, viewName, title) {
    try {
      const items = await Model.findAll({ order: [['createdAt', 'DESC']] });
      res.render(viewName, { 
        title, 
        items,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا در دریافت اطلاعات');
    }
  },

  // نمایش فرم ایجاد
  createForm(req, res, viewName, title) {
    res.render(viewName, { 
      title, 
      item: null,
      error: null,
      user: req.session.adminUsername
    });
  },

  // ذخیره آیتم جدید
  async create(Model, req, res, viewName, redirectPath, fields) {
    try {
      const data = {};
      fields.forEach(field => {
        if (req.body[field] !== undefined) data[field] = req.body[field];
      });
      
      await Model.create(data);
      res.redirect(redirectPath);
    } catch (error) {
      console.error(error);
      res.render(viewName, { 
        title: 'خطا', 
        item: req.body,
        error: 'خطا در ذخیره اطلاعات',
        user: req.session.adminUsername
      });
    }
  },

  // نمایش فرم ویرایش
  async editForm(Model, req, res, viewName, title) {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) {
        return res.status(404).send('یافت نشد');
      }
      res.render(viewName, { 
        title, 
        item,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // به‌روزرسانی آیتم
  async update(Model, req, res, redirectPath, fields) {
    try {
      const item = await Model.findByPk(req.params.id);
      if (!item) {
        return res.status(404).send('یافت نشد');
      }
      
      fields.forEach(field => {
        if (req.body[field] !== undefined) item[field] = req.body[field];
      });
      
      await item.save();
      res.redirect(redirectPath);
    } catch (error) {
      console.error(error);
      res.redirect(redirectPath);
    }
  },

  // حذف آیتم
  async delete(Model, req, res, redirectPath) {
    try {
      await Model.destroy({ where: { id: req.params.id } });
      res.redirect(redirectPath);
    } catch (error) {
      console.error(error);
      res.redirect(redirectPath);
    }
  }
};

module.exports = baseController;