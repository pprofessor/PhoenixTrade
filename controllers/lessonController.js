const baseController = require('./baseController');
const { Lesson, Category } = require('../models');

const lessonController = {
  // نمایش لیست درس‌ها
  list: async (req, res) => {
    try {
      const lessons = await Lesson.findAll({ 
        include: [{ model: Category, as: 'category' }],
        order: [['order', 'ASC']]
      });
      res.render('lessons', { 
        title: 'مدیریت درس‌ها',
        lessons,
        categories: await Category.findAll(),
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // فرم ایجاد درس جدید
  createForm: async (req, res) => {
    const categories = await Category.findAll();
    res.render('lesson-form', { 
      title: 'درس جدید',
      lesson: null,
      categories,
      error: null,
      user: req.session.adminUsername
    });
  },

  // ذخیره درس جدید
  create: async (req, res) => {
    try {
      await Lesson.create(req.body);
      res.redirect('/pprofessor/lessons');
    } catch (error) {
      console.error(error);
      res.redirect('/pprofessor/lessons/new');
    }
  },

  // فرم ویرایش درس
  editForm: async (req, res) => {
    try {
      const lesson = await Lesson.findByPk(req.params.id);
      const categories = await Category.findAll();
      res.render('lesson-form', { 
        title: 'ویرایش درس',
        lesson,
        categories,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  // به‌روزرسانی درس
  update: async (req, res) => {
    try {
      await Lesson.update(req.body, { where: { id: req.params.id } });
      res.redirect('/pprofessor/lessons');
    } catch (error) {
      console.error(error);
      res.redirect(`/pprofessor/lessons/${req.params.id}/edit`);
    }
  },

  // حذف درس
  delete: async (req, res) => {
    try {
      await Lesson.destroy({ where: { id: req.params.id } });
      res.redirect('/pprofessor/lessons');
    } catch (error) {
      console.error(error);
      res.redirect('/pprofessor/lessons');
    }
  }
};

module.exports = lessonController;