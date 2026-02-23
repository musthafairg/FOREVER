import User from "../models/userModel.js";
export const userAuth = async (req, res, next) => {
  try {
  if (!req.session?.user?._id) {
  if (req.headers.accept.includes("json")) {
    return res.status(401).json({ success: false });
  }
  return res.redirect("/login");
}
    const user = await User.findById(req.session.user._id);

    if (!user || user.isBlocked) {
      delete req.session.user;
      return res.redirect("/login");
    }

    next();
  } catch (error) {
    console.error("UserAuth error:", error.message);
    return res.redirect("/login");
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    const adminId = req.session.admin;

    if (!adminId) {
      return res.redirect("/admin/login");
    }

    const admin = await User.findById(adminId);

    if (admin && admin.isAdmin) {
      return next();
    }

    delete req.session.admin;
    return res.redirect("/admin/login");

  } catch (error) {
    console.error("Error in adminAuth middleware:", error.message);
    return res.status(500).send("Server Error");
  }
};
