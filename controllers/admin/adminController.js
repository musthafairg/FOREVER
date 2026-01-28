import User from "../../models/userModel.js";
import bcrypt from "bcrypt";

export const loadLogin = async (req, res) => {
  try {
    if (req.session.admin) {
      return res.redirect("/admin/");
    }
    return res.render("admin/login");
  } catch (error) {
    console.error("admin Login page not loading : ", error.message);

    return res.status(500).send("Server Error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const admin = await User.findOne({ email, isAdmin: true });

    if (admin) {
      const passwordMatch = await bcrypt.compare(password, admin.password);

      if (passwordMatch) {
        req.session.admin = admin._id;
        return res.json({ success: true });
      } else {
        return res.json({
          success: false,
          message: "Password do not match",
        });
      }
    } else {
      return res.json({
        success: false,
        message: "Email not found",
      });
    }
  } catch (error) {
    console.error("Admin Login Post error : ", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const logout = async (req, res) => {
  try {
    delete req.session.admin;

    return res.redirect("/admin/login");
  } catch (error) {
    console.error("Error in admin logout:", error.message);
    return res.status(500).send("Server Error");
  }
};
