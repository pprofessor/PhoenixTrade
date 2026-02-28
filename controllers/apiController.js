const { Lesson, Category, Broker, Event } = require('../models');

const apiController = {
  // لیست همه APIها
  index: (req, res) => {
    const apis = [
      { method: 'GET', path: '/api/health', description: 'بررسی سلامت' },
      { method: 'GET', path: '/api/categories', description: 'لیست دسته‌بندی‌ها' },
      { method: 'GET', path: '/api/lessons', description: 'لیست درس‌ها' },
      { method: 'GET', path: '/api/lessons/:id', description: 'جزئیات درس' },
      { method: 'GET', path: '/api/brokers', description: 'لیست بروکرها' },
      { method: 'GET', path: '/api/events', description: 'لیست رویدادها' }
    ];
    
    res.render('api', { 
      title: 'مدیریت APIها',
      apis,
      user: req.session.adminUsername
    });
  },

  // نمونه‌های API (برای تست)
  getCategories: async (req, res) => {
    const categories = await Category.findAll();
    res.json(categories);
  },

  getLessons: async (req, res) => {
    const lessons = await Lesson.findAll({ 
      include: [{ model: Category, as: 'category' }] 
    });
    res.json(lessons);
  },

  getBrokers: async (req, res) => {
    const brokers = await Broker.findAll({ where: { isActive: true } });
    res.json(brokers);
  },

  getEvents: async (req, res) => {
    const events = await Event.findAll({ where: { isActive: true } });
    res.json(events);
  }
};

module.exports = apiController;