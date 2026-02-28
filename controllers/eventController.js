const { Event } = require('../models');

const eventController = {
  list: async (req, res) => {
    try {
      const events = await Event.findAll({ order: [['eventDate', 'DESC']] });
      res.render('events', { 
        title: 'مدیریت رویدادها',
        events,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  createForm: (req, res) => {
    res.render('event-form', { 
      title: 'رویداد جدید',
      event: null,
      error: null,
      user: req.session.adminUsername
    });
  },

  create: async (req, res) => {
    try {
      await Event.create(req.body);
      res.redirect('/pprofessor/events');
    } catch (error) {
      console.error(error);
      res.render('event-form', { 
        title: 'رویداد جدید',
        event: req.body,
        error: 'خطا در ذخیره اطلاعات',
        user: req.session.adminUsername
      });
    }
  },

  editForm: async (req, res) => {
    try {
      const event = await Event.findByPk(req.params.id);
      res.render('event-form', { 
        title: 'ویرایش رویداد',
        event,
        error: null,
        user: req.session.adminUsername
      });
    } catch (error) {
      console.error(error);
      res.status(500).send('خطا');
    }
  },

  update: async (req, res) => {
    try {
      await Event.update(req.body, { where: { id: req.params.id } });
      res.redirect('/pprofessor/events');
    } catch (error) {
      console.error(error);
      res.redirect(`/pprofessor/events/${req.params.id}/edit`);
    }
  },

  delete: async (req, res) => {
    try {
      await Event.destroy({ where: { id: req.params.id } });
      res.redirect('/pprofessor/events');
    } catch (error) {
      console.error(error);
      res.redirect('/pprofessor/events');
    }
  }
};

module.exports = eventController;