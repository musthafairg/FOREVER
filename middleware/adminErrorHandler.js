export const adminNotFound = (req, res, next) => {
  if (req.originalUrl.startsWith("/admin")) {
    return res.status(404).render("admin/errors/404");
  }
  next();
};

export const adminErrorHandler = (err, req, res, next) => {
  console.error("ADMIN ERROR:", err);

  if (req.originalUrl.startsWith("/admin")) {
    return res.status(500).render("admin/errors/500");
  }

  next(err);
};
