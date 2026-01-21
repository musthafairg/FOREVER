import "dotenv/config";
import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import {
  securePassword,
  generateOtp,
  sendVerificationEmail,
} from "../../services/user/userServices.js";
import bcrypt from "bcrypt";
import ProductOffer from "../../models/productofferModel.js";
import CategoryOffer from "../../models/categoryofferModel.js";
import { generateReferralCode } from "../../utils/generateReferralCode.js";
import Coupon from "../../models/couponModel.js";

export const loadOtp = async (req, res) => {
  try {
    res.render("user/otp-verification");
  } catch (error) {
    console.error("OTP page not loading");
  }
};

export const loadHomepage = async (req, res) => {
  try {
    const user = req.session.user;

    const products = await Product.find({ isBlocked: false })
      .sort({ createdAt: -1 })
      .limit(10);

    const productOffers = await ProductOffer.find({ isActive: true });
    const categoryOffers = await CategoryOffer.find({ isActive: true });

    const productOfferMap = new Map();
    const categoryOfferMap = new Map();

    productOffers.forEach((o) =>
      productOfferMap.set(o.productId.toString(), o.discount),
    );

    categoryOffers.forEach((o) =>
      categoryOfferMap.set(o.categoryId.toString(), o.discount),
    );

    const productsWithOffer = products.map((product) => {
      const productDiscount = productOfferMap.get(product._id.toString()) || 0;

      const categoryDiscount = categoryOfferMap.get(
        product.category?._id.toString() || 0,
      );

      const maxDiscount = Math.max(productDiscount, categoryDiscount);

      const finalPrice =
        maxDiscount > 0
          ? Math.round(
              product.regularPrice - (product.regularPrice * maxDiscount) / 100,
            )
          : product.regularPrice;

      return {
        ...product.toObject(),
        finalPrice,
        discountPercent: maxDiscount,
      };
    });

    return res.render("user/home", {
      products: productsWithOffer,
      user,
    });
  } catch (error) {
    console.error("Home page not loading :", error.message);
    res.status(500).send("Server Error");
  }
};

export const loadShoppingPage = async (req, res) => {
  try {
    const user = req.session.user;

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    let limit = 9;

    let skip = (page - 1) * limit;
    let search = "";

    if (req.query.search) {
      search = req.query.search;
    }

    const gt = Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt;
    const lt = Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt;

    const categoryId = req.query.category;
    let sort = "";
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const sortQuery = {
      priceHigh: { regularPrice: -1 },
      priceLow: { regularPrice: 1 },
      az: { productName: 1 },
      za: { productName: -1 },
    };

    const filter = {
      isBlocked: false,
      productName: { $regex: ".*" + search + ".*", $options: "i" },
    };

    const products = await Product.find(filter)
      .sort(sortQuery[sort] || {})
      .collation({ locale: "en", strength: 2 })
      .skip(skip)
      .limit(limit);

    const productOffers = await ProductOffer.find({ isActive: true });
    const categoryOffers = await CategoryOffer.find({ isActive: true });

    const productOfferMap = new Map();
    const categoryOfferMap = new Map();

    productOffers.forEach((o) =>
      productOfferMap.set(o.productId.toString(), o.discount),
    );

    categoryOffers.forEach((o) =>
      categoryOfferMap.set(o.categoryId.toString(), o.discount),
    );

    const productsWithOffer = products.map((product) => {
      const productDiscount = productOfferMap.get(product._id.toString()) || 0;

      const categoryDiscount = categoryOfferMap.get(
        product.category?._id.toString() || 0,
      );

      const maxDiscount = Math.max(productDiscount, categoryDiscount);

      const finalPrice =
        maxDiscount > 0
          ? Math.round(
              product.regularPrice - (product.regularPrice * maxDiscount) / 100,
            )
          : product.regularPrice;

      return {
        ...product.toObject(),
        finalPrice,
        discountPercent: maxDiscount,
      };
    });

    const totalProducts = await Product.countDocuments(filter);

    const totalPages = Math.ceil(totalProducts / limit);

    const category = await Category.find({ isListed: true });

    res.render("user/shop", {
      products: productsWithOffer,
      category,
      currentPage: page,
      totalPages,
      search,
      sort,
      categoryId,
      gt,
      lt,
      user,
    });
  } catch (error) {
    console.error("Error in loadin shopping page :", error.message);
    res.status(500).send("server error");
  }
};

export const loadSignup = (req, res) => {
  try {
    return res.render("user/signup");
  } catch (error) {
    console.error("Signup page not Loading ", error.message);
    res.status(500).send("Server Error");
  }
};

export const loadLogin = (req, res) => {
  try {
    if (req.session.user) {
      return res.redirect("/");
    }
    return res.render("user/login");
  } catch (error) {
    console.error("Login page not Loading", error.message);
    res.status(500).send("Server Error");
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const existingUser = await User.findOne({ email });

    console.log("exist................", existingUser);

    if (!existingUser) {
      return res.json({
        success: false,
        message: "Email not found",
      });
    }

    if (existingUser.isBlocked) {
      return res.json({
        success: false,
        message: "User blocked by Admin",
      });
    }

    const passwordMatched = await bcrypt.compare(
      password,
      existingUser.password,
    );

    if (!passwordMatched) {
      return res.json({
        success: false,
        message: "Passwords do not match",
      });
    }

    req.session.user = existingUser;

    console.log("user..........", req.session.user);

    return res.json({ success: true });
  } catch (error) {
    console.error("Error in post login");

    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const signupUser = async (req, res) => {
  try {
    const { name, mobile, email, password, confirmPassword, referalCode } =
      req.body;

    if (!name || !mobile || !email || !password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "All fields are required",
      });
    }

    let referringUser = null;
    if (referalCode) {
      referringUser = await User.findOne({ referalCode: referalCode });
      if (!referringUser) {
        return res.status(400).json({
          success: false,
          message: "Invalid referral code.",
        });
      }
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "User already exists",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.status(500).json({
        success: false,
        message: "OTP sending failed",
      });
    }
    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 60 * 1000;
    req.session.userData = {
      name,
      mobile,
      email,
      password,
      referalCode: referalCode || null,
      referredBy: referringUser ? referringUser._id : null,
    };

    console.log("OTP Sent  : ", otp);

    return res.status(200).json({
      success: true,
      message: "OTP sent successfully",
      redirect: "/otp-page",
    });
  } catch (error) {
    console.error("Signup Error :", error.message);
    return res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

export const verifyOtp = async (req, res) => {
  try {
    const { otp } = req.body;
    console.log("otp from req.body ", otp);

    if (Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    if (otp === req.session.userOtp) {
      const user = req.session.userData;
      const passwordHash = await securePassword(user.password);

      const referralCodeGenerated = generateReferralCode(user.name);

      const saveUserData = new User({
        name: user.name,
        email: user.email,
        mobile: user.mobile,
        password: passwordHash,
        referalCode: referralCodeGenerated,
        referredBy: user.referredBy || null,
      });

      await saveUserData.save();
      req.session.user = saveUserData;

      if (user.referredBy) {
        const referringUser = await User.findById(user.referredBy);

        if (referringUser) {
          const rewardCoupon = new Coupon({
            code: `REF-${referringUser.referalCode}-${Date.now()}`,
            discountType: "PERCENT",
            discountValue: 20,
            minPurchase: 500,
            maxDiscount: 200,
            expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
            usageLimit: 1,
          });

          await rewardCoupon.save();
          console.log("Reward coupon created for referring user" , rewardCoupon.code);

          await User.findByIdAndUpdate(referringUser._id, {
            $push: { redeemedUsers: saveUserData._id },
          });
        }
      }

      req.session.user = saveUserData;

      req.session.userOtp = null;
      req.session.otpExpires = null;

      return res.json({ success: true, redirectUrl: "/login" });
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

export const resendOtp = async (req, res) => {
  try {
    const userData = req.session.userData;

    if (!userData || !userData.email) {
      return res.status(400).json({
        success: false,
        message: "Session Expired. Please signup again.",
      });
    }

    const email = userData.email;

    const otp = generateOtp();
    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 60 * 1000;

    const emailSent = await sendVerificationEmail(email, otp);

    if (emailSent) {
      console.log("Resend OTP : ", otp);

      return res.status(200).json({
        success: true,
        message: "OTP resent successfully.",
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to resen OTP. Please try again.",
      });
    }
  } catch (error) {
    console.error("Error resending OTP : ", error.message);

    return res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again.",
    });
  }
};

export const getForgotPassEmailPage = async (req, res) => {
  try {
    res.render("user/forgot-pass-email");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

export const getResetPassPage = async (req, res) => {
  try {
    res.render("user/reset-password");
  } catch (error) {
    res.status(500).send("Internal Server Error");
  }
};

export const emailValid = async (req, res) => {
  try {
    const { email } = req.body;

    const isEmailVaid = await User.findOne({ email: email });

    if (!isEmailVaid) {
      return res.render("user/forgot-pass-email", { error: "Email not found" });
    }

    const otp = generateOtp();

    const emailSent = await sendVerificationEmail(email, otp);

    if (!emailSent) {
      return res.render("user/forgot-pass-email", {
        error: "Failed to send OTP. Try again.",
      });
    }

    req.session.userOtp = otp;
    req.session.otpExpires = Date.now() + 60 * 1000;
    req.session.userData = { email };

    console.log("OTP sent : ", otp);
    return res.render("user/forgot-pass-otp");
  } catch (error) {
    console.error("Email Verification Error");
    return res.send("Server Error");
  }
};

export const verifyOTPForgotPass = async (req, res) => {
  try {
    const { otp } = req.body;

    console.log("OTP :", otp);

    if (!req.session.userOtp || !req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "Session expired. Please resend OTP.",
      });
    }

    if (Date.now() > req.session.otpExpires) {
      return res.status(400).json({
        success: false,
        message: "OTP expired. Please resend OTP.",
      });
    }

    console.log("req.session.userOTP", req.session.userOtp);

    if (otp === req.session.userOtp) {
      req.session.userOtp = null;
      req.session.otpExpires = null;
      return res.json({ success: true, redirectUrl: "/reset-password" });
    }
    return res.status(400).json({
      success: false,
      message: "Invalid OTP. Please try again",
    });
  } catch (error) {
    console.error("Error verifying OTP :", error.message);
    return res.status(500).send("Server Error");
  }
};

export const resetPassword = async (req, res) => {
  try {
    const { password, confirmPassword } = req.body;
    const userEmail = req.session.userData.email;
    console.log("User mail", userEmail);

    if (!password == confirmPassword) {
      res.render("user/reset-password", { error: "Password didn't match" });
    }

    const passwordHash = await securePassword(password);

    const updatedUserData = await User.findOneAndUpdate(
      { email: userEmail },
      { password: passwordHash },
      { new: true },
    );
    console.log("Updated UserData :", updatedUserData);

    return res.redirect("/login");
  } catch (error) {
    console.error("Error in Reset Password :", error.message);

    res.status(500).send("Internal Server Error");
  }
};

export const logout = async (req, res) => {
  try {
    console.log(req.path);

    req.session.destroy((err) => {
      if (err) {
        console.error("Session destroy error :", err.message);
        res.redirect("");
      }
      res.redirect("/login");
    });
  } catch (error) {
    console.error("Error in logout :", error.message);
    res.redirect("");
  }
};

export const demoLogin = async (req, res) => {
  try {
    const demoEmail = "demo@forever.com";
    const demoUser = await User.findOne({ email: demoEmail });

    if (!demoUser) {
      return res.send("Demo user not found. Please create a demo user in DB.");
    }

    req.session.user = {
      _id: demoUser._id,
      name: demoUser.name,
      email: demoUser.email,
    };

    return res.redirect("/");
  } catch (error) {
    console.error("Error in demo Login :", error.message);
    return res.send("Server Error");
  }
};
