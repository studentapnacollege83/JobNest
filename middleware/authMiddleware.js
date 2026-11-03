
exports.isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  next();
};

exports.isGuest = (req, res, next) => {
  if (req.session.user) {
    return res.redirect("/dashboard");
  }

  next();
};

exports.isEmployer = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (req.session.user.role !== "employer") {
    return res.status(403).send("Access denied: Employers only.");
  }

  next();
};

exports.isJobSeeker = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect("/login");
  }

  if (String(req.session.user.role || "").trim().toLowerCase() !== "jobseeker") {
    return res.status(403).send("Access denied: Job Seekers only.");
  }

  next();
};
