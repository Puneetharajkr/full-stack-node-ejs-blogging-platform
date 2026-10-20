const requireAuth = (req, res, next) => {
  if (req.session?.userId) {
    next();
  } else {
    res.redirect("/api/login");
  }
};

const checkAuth = (req, res, next) => {
  res.locals.userId = req.session?.userId ?? null;
  res.locals.isAuthenticated = Boolean(res.locals.userId);
  next();
};

module.exports = { requireAuth, checkAuth };
