const express = require('express');
const router = express.Router();
const { loginPage, login, logout, dashboardPage } = require('../controllers/authController');
const { isAuthenticated } = require('../middleware/auth');

// مسیرهای عمومی
router.get('/login', loginPage);
router.post('/login', login);
router.get('/logout', logout);

// مسیرهای محافظت شده
router.get('/dashboard', isAuthenticated, dashboardPage);

module.exports = router;