import User from "../models/userModel.js";

export const userAuth = async (req, res, next) => {
  try {
    const sessionUser = req.session.user;

    if (!sessionUser) {
      return res.redirect("/login");
    }

    const user = await User.findById(sessionUser._id);

    if (user && !user.isBlocked) {
      return next();
    }

    if (user && user.isBlocked) {
    
      delete req.session.user;

      console.log("Blocked user session cleared (user only).");
      return res.redirect("/login");
    }

    delete req.session.user;
    return res.redirect("/login");

  } catch (error) {
    console.error("Error in userAuth middleware:", error.message);
    return res.status(500).send("Server Error");
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
