const { Broker } = require('../models');

const brokerController = {
  // نمایش لیست بروکرها
  list: async (req, res) => {
    try {
      const brokers = await Broker.findAll({ order: [['createdAt', 'DESC']] });
      res.render('brokers', { 
        title: 'مدیریت بروکرها',
        brokers,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // فرم ایجاد بروکر جدید
  createForm: (req, res) => {
    res.render('broker-form', { 
      title: 'بروکر جدید',
      broker: null,
      error: null,
      user: req.session.adminUsername
    });
  },

  // ذخیره بروکر جدید
  create: async (req, res) => {
    try {
      await Broker.create(req.body);
      res.redirect('/pprofessor/brokers');
    } catch (error) {
      console.error(error);
      res.render('broker-form', { 
        title: 'بروکر جدید',
        broker: req.body,
        error: 'خطا در ذخیره اطلاعات',
        user: req.session.adminUsername
      });
    }
  },

  // فرم ویرایش بروکر
  editForm: async (req, res) => {
    try {
      const broker = await Broker.findByPk(req.params.id);
      res.render('broker-form', { 
        title: 'ویرایش بروکر',
        broker,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // به‌روزرسانی بروکر
  update: async (req, res) => {
    try {
      await Broker.update(req.body, { where: { id: req.params.id } });
      res.redirect('/pprofessor/brokers');
    } catch (error) {
      console.error(error);
      res.redirect(`/pprofessor/brokers/${req.params.id}/edit`);
    }
  },

  // حذف بروکر
  delete: async (req, res) => {
    try {
      await Broker.destroy({ where: { id: req.params.id } });
      res.redirect('/pprofessor/brokers');
    } catch (error) {
      console.error(error);
      res.redirect('/pprofessor/brokers');
    }
  }
};

module.exports = brokerController;