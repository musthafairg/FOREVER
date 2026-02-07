export const notFound = (req, res, next) => {
  res.status(404);
  res.render("errors/404", {
    page: "error",
    url: req.originalUrl,
  });
};

export const errorHandler = (err, req, res, next) => {
  console.error("ERROR:", err.stack);

  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;

  res.status(statusCode).render("errors/500", {
    page: "error",
    message: err.message || "Something went wrong",
  });
};
