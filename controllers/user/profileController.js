import User from "../../models/userModel.js";
import Address from "../../models/addressModel.js";
import bcrypt from "bcrypt";
import {
  securePassword,
  generateOtp,
  sendVerificationEmail,
} from "../../services/user/userServices.js";

export const loadUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);

    const addressData = await Address.findOne({ userId: req.session.user._id });

    let defaultAddress = null;
    if (addressData && addressData.address.length > 0) {
      defaultAddress = addressData.address.find(
        (addr) => addr.isDefault === true,
      );
    }

    res.render("user/profile", {
      user,
      defaultAddress,
    });
  } catch (error) {
    console.error("Error in load Profile page :", error.message);
    return res.status(500).send("Server Error");
  }
};

export const loadEditProfilePage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("user/edit-profile", { user });
  } catch (error) {
    console.error("Error in load Edit Profile page :", error.message);
    return res.status(500).send("Server Error");
  }
};

export const loadEditPasswordPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("user/edit-password", { user });
  } catch (error) {
    console.error("Error in load Edit Profile page :", error.message);
    return res.status(500).send("Server Error");
  }
};

export const loadChangeEmailPage = async (req, res) => {
  try {
    const user = await User.findById(req.session.user._id);
    res.render("user/change-email", { user });
  } catch (error) {
    console.error("Error in load Change email page :", error.message);
    return res.status(500).send("Server Error");
  }
};

export const updateProfile = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const updateData = {
      name: req.body.name,
      mobile: req.body.mobile,
    };

    if (req.file) {
      updateData.profileImage = req.file.filename;
    }

    await User.findByIdAndUpdate(userId, updateData);

    req.session.user.name = req.body.name;

    res.redirect("/user-profile");
  } catch (error) {
    console.error("Edit profile error: ", error.message);
    res.redirect("/edit-profile");
  }
};

export const changePassword = async (req, res) => {
  try {
    const { current_password, new_password, confirm_password } = req.body;
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    const passwordmatched = await bcrypt.compare(
      current_password,
      user.password,
    );

    if (!passwordmatched) {
      return res.json({
        success: false,
        message: "Current Password not matched",
      });
    }

    if (!new_password === confirm_password) {
      return res.json({
        success: false,
        message: "Confirm Password not matched",
      });
    }

    const passwordHash = await bcrypt.hash(new_password, 10);
    const updatepassword = {
      password: passwordHash,
    };

    await User.findByIdAndUpdate(userId, updatepassword);

    return res.json({
      success: true,
    });
  } catch (error) {
    console.error("Error in change password :", error.message);

    res.status(500).send("Internal server error");
  }
};

export const updateEmail = async (req, res) => {
  try {
    const { new_email } = req.body;

    if (!new_email) {
      return res.json({
        success: false,
        message: "This field is required, Enter Valid Email",
      });
    }

    const otp = generateOtp();
    console.log("otp", otp);

    const emailSent = await sendVerificationEmail(new_email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "OTP sending failed",
      });
    }
    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 60 * 1000;
    req.session.userData = { email: new_email };

    console.log("OTP Sent  : ", otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      redirect: "/otp-page-user-profile",
    });
  } catch (error) {
    console.error("Error in update email :", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const getotp = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    res.render("user/otp-page", { user });
  } catch (error) {
    console.error("Error in load OTP page :", error.message);
  }
};

export const verifyOtpEmail = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { otp } = req.body;

    if (Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    if (otp === req.session.userOtp) {
      const newEmail = req.session.userData.email;

      const updateEmail = {
        email: newEmail,
      };

      await User.findByIdAndUpdate(userId, updateEmail);

      req.session.userOtp = null;
      req.session.otpExpires = null;

      return res.json({ success: true, redirectUrl: "/user-profile" });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again.",
    });
  } catch (error) {
    console.error("Error verifying OTP", error.message);

    res.status(500).json({ success: false, message: "An error occured." });
  }
};
