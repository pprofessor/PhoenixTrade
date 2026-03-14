// ============= middleware/auth.js =============
const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.adminId) {
    return next();
  }
  
  // اگر درخواست AJAX است
  if (req.xhr || req.headers['x-requested-with'] === 'XMLHttpRequest' || req.path.startsWith('/api/')) {
    return res.status(401).json({ 
      success: false, 
      error: 'Unauthorized. Please login again.' 
    });
  }
  
  res.redirect('/pprofessor/login');
};

module.exports = { isAuthenticated };