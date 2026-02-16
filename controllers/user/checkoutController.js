import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import { applyBestOffer } from "../../utils/applyBestOffer.js";
import Coupon from "../../models/couponModel.js";

export const loadCheckout = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const couponData = req.session.appliedCoupon || null;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart || cart.items.length === 0) {
      return res.redirect("/cart");
    }

    cart.items = cart.items.filter((item) => {
      const p = item.productId;

      if (!p || p.isBlocked || p.status !== "Available") {
        return false;
      }

      const selectedVariant = p.variants.find((v) => v.size === item.size);

      return selectedVariant && selectedVariant.quantity >= item.quantity;
    });

    if (cart.items.length === 0) {
      return res.redirect("/cart");
    }

    let subtotal = 0;

    const checkoutItems = await Promise.all(
      cart.items.map(async (item) => {
        const product = item.productId;

        const selectedVariant = product.variants.find(
          (v) => v.size === item.size,
        );

        if (!selectedVariant) return null;

        const offer = await applyBestOffer(product);
        const discountPercent = offer.discountPercent || 0;

        const originalPrice = selectedVariant.price;

        const finalPrice =
          discountPercent > 0
            ? Math.round(
                originalPrice - (originalPrice * discountPercent) / 100,
              )
            : originalPrice;

        const itemTotal = finalPrice * item.quantity;

        subtotal += itemTotal;

        return {
          ...item.toObject(),
          finalPrice,
          originalPrice,
          discountPercent,
          itemTotal,
        };
      }),
    );

    const shipping = 0;
    const tax = Math.round(subtotal * 0.05);

    let couponDiscount = 0;
    let coupon = null;

    if (couponData) {
      const validCoupon = await Coupon.findOne({
        _id: couponData.id,
        isActive: true,
        expiryDate: { $gt: new Date() },
        minPurchase: { $lte: subtotal },
      });

      if (validCoupon) {
        couponDiscount = Math.min(couponData.discount, subtotal);
        coupon = couponData;
      } else {
        req.session.appliedCoupon = null;
      }
    }

    const total = Math.max(subtotal + tax + shipping - couponDiscount, 0);

    const addressData = await Address.findOne({ userId });
    const addresses = addressData ? addressData.address : [];
    const defaultAddress = addresses.find((a) => a.isDefault) || null;

    const coupons = await Coupon.find({
      isActive: true,
      expiryDate: { $gt: new Date() },
      minPurchase: { $lte: subtotal },
      $or: [{ createdFor: null }, { createdFor: userId }],
    });

    res.render("user/checkout", {
      user,
      cart: { ...cart.toObject(), items: checkoutItems },
      addresses,
      defaultAddress,
      subtotal,
      discount: couponDiscount,
      shipping,
      tax,
      total,
      coupon,
      couponDiscount,
      coupons,
    });
  } catch (error) {
    console.error("Checkout load error:", error.message);
    res.status(500).render("errors/500");
  }
};
