function redirectIfAuthenticated(req, res, next) {
    if (req.session.userId) {
      // User is already logged in, redirect to their respective dashboard
      if (req.session.role === 'admin') {
        return res.redirect('/admin/dashboard'); // Redirect to admin dashboard
      } else {
        return res.redirect('/book'); // Redirect to user dashboard
      }
    }
    next(); // Proceed to the requested page if not authenticated
  }
  
  module.exports = redirectIfAuthenticated;
  