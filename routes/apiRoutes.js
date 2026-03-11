const express = require('express');
const router = express.Router();
const { BotMessage, WebappPage, Lesson, Broker, BotUser, Event } = require('../models');
const { isAuthenticated } = require('../middleware/auth');

// ============= API آمار داشبورد =============
router.get('/dashboard/stats', isAuthenticated, async (req, res) => {
    try {
        const [botMessages, webappPages, lessons, brokers, botUsers, events] = await Promise.all([
            BotMessage.findAndCountAll({ where: { isActive: true } }),
            WebappPage.findAndCountAll({ where: { isActive: true } }),
            Lesson.findAndCountAll({ where: { isActive: true } }),
            Broker.findAndCountAll({ where: { isActive: true } }),
            BotUser.count(),
            Event.findAndCountAll({ where: { isActive: true } })
        ]);

        res.json({
            bot_messages: { total: botMessages.count, active: botMessages.count },
            webapp_pages: { total: webappPages.count, active: webappPages.count },
            lessons: { total: lessons.count, active: lessons.count, categories: 3 },
            brokers: { total: brokers.count, active: brokers.count },
            bot_users: { total: botUsers, active: Math.floor(botUsers * 0.6) },
            events: { total: events.count, active: events.count }
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

module.exports = router;