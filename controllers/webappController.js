const { WebappPage } = require('../models');

const webappController = {
  // لیست صفحات
  list: async (req, res) => {
    try {
      const pages = await WebappPage.findAll();
      res.render('webapp', { 
        title: 'مدیریت WebApp',
        pages,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // فرم ایجاد صفحه جدید
  createForm: (req, res) => {
    res.render('webapp-form', { 
      title: 'صفحه جدید WebApp',
      page: null,
      error: null,
      user: req.session.adminUsername
    });
  },

  // ذخیره صفحه جدید
  create: async (req, res) => {
    try {
      await WebappPage.create(req.body);
      res.redirect('/pprofessor/webapp');
    } catch (error) {
      console.error(error);
      res.render('webapp-form', { 
        title: 'صفحه جدید WebApp',
        page: req.body,
        error: 'خطا در ذخیره اطلاعات',
        user: req.session.adminUsername
      });
    }
  },

  // فرم ویرایش صفحه
  editForm: async (req, res) => {
    try {
      const page = await WebappPage.findByPk(req.params.id);
      res.render('webapp-form', { 
        title: 'ویرایش صفحه WebApp',
        page,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // به‌روزرسانی صفحه
  update: async (req, res) => {
    try {
      await WebappPage.update(req.body, { where: { id: req.params.id } });
      res.redirect('/pprofessor/webapp');
    } catch (error) {
      console.error(error);
      res.redirect(`/pprofessor/webapp/${req.params.id}/edit`);
    }
  },

  // حذف صفحه
  delete: async (req, res) => {
    try {
      await WebappPage.destroy({ where: { id: req.params.id } });
      res.redirect('/pprofessor/webapp');
    } catch (error) {
      console.error(error);
      res.redirect('/pprofessor/webapp');
    }
  }
};

module.exports = webappController;