import User from "../models/userModel.js";

export const userAuth = async (req, res, next) => {
  try {
    const SessionUser = req.session.user;

    if (!SessionUser) {
      return res.redirect("/login");
    }

    const user = await User.findById(SessionUser._id);
    if (user && !user.isBlocked) {
      return next();
    }

    if (user && user.isBlocked) {
      req.logout((err) => {
        if (err) {
          console.error("Logout Error", err.message);
        }

        req.session.destroy(() => {
          console.log("Blocked User Session destroyed.");
          return res.redirect("/login");
        });
      });

      return;
    }

    return res.redirect("/login");
  } catch (error) {
    console.error("Error in userAuth middleware :", error.message);
    return res.status(500).send(" Server Error");
  }
};

export const adminAuth = async (req, res, next) => {
  try {
    if (!req.session.admin) {
      return res.redirect("/admin/login");
    }
    const admin = await User.findById(req.session.admin);

    if (admin && admin.isAdmin) {
      return next();
    }

    return res.redirect("/admin/login");
  } catch (error) {
    console.error("Error in adminAuth mioddleware: ", error.message);
    res.status(500).send("Server Error");
  }
};
