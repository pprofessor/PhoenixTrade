const { Admin } = require('../models');

const loginPage = (req, res) => {
  res.render('login', { 
    title: 'ورود به پنل مدیریت',
    error: null 
  });
};

const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log('🔐 تلاش ورود:', username);
    
    const admin = await Admin.findOne({ where: { username } });
    
    if (!admin) {
      console.log('❌ کاربر یافت نشد');
      return res.render('login', { 
        title: 'ورود به پنل مدیریت',
        error: 'نام کاربری یا رمز عبور اشتباه است' 
      });
    }
    
    const isValid = await admin.validatePassword(password);
    
    if (!isValid) {
      console.log('❌ رمز عبور اشتباه');
      return res.render('login', { 
        title: 'ورود به پنل مدیریت',
        error: 'نام کاربری یا رمز عبور اشتباه است' 
      });
    }
    
    console.log('✅ ورود موفق');
    req.session.isAdmin = true;
    req.session.adminId = admin.id;
    req.session.adminRole = admin.role;
    req.session.adminUsername = admin.username;
    
    await admin.update({ lastLogin: new Date() });
    
    res.redirect('/pprofessor/dashboard');
    
  } catch (error) {
    console.error('❌ Login error:', error);
    res.render('login', { 
      title: 'ورود به پنل مدیریت',
      error: 'خطا در سرور' 
    });
  }
};

const logout = (req, res) => {
  req.session.destroy();
  res.redirect('/pprofessor/login');
};

const dashboardPage = (req, res) => {
  res.render('dashboard', { 
    title: 'داشبورد مدیریت',
    user: req.session.adminUsername || 'مدیر'
  });
};

module.exports = { loginPage, login, logout, dashboardPage };