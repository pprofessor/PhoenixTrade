const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.isAdmin) {
    return next();
  }
  res.redirect('/pprofessor/login');
};

module.exports = { isAuthenticated };