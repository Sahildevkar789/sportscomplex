// Ensure the user is logged in
function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  }
  req.flash('error', 'Please log in to access this resource');
  res.redirect('/login');
}

// Ensure the user is an admin
function isAdmin(req, res, next) {
  if (req.session.role === 'admin') {
    return next();
  }
  req.flash('error', 'Access denied: Admins only');
  res.redirect('/');
}
function isLoggedIn(req, res, next) {
  // Check if the user is authenticated by checking for the userId in the session
  if (!req.session.userId) {
      // Store the original URL the user tried to access, so we can redirect them after login
      req.session.redirectUrl = req.originalUrl;

      // Flash an error message to inform the user that they must log in
      req.flash("error", "You must be logged in to access this resource.");

      // Redirect to the login page
      return res.redirect("/login");
  }
  // If the user is logged in, allow them to proceed to the next middleware or route handler
  next();
};

module.exports = { isAuthenticated, isAdmin,isLoggedIn };
