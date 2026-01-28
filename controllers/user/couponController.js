import Coupon from "../../models/couponModel.js";

export const applyCoupon = async (req, res) => {
  try {
    const { code, subtotal } = req.body;

    const coupon = await Coupon.findOne({
      code: code.toUpperCase(),
      isActive: true,
    });

    if (!coupon) {
      return res.json({ success: false, message: "Invalid coupon" });
    }

    if (coupon.expiryDate < new Date()) {
      return res.json({ success: false, message: "Coupon expired" });
    }

    if (coupon.usedCount >= coupon.usageLimit) {
      return res.json({
        success: false,
        message: "Coupon usage limit reached",
      });
    }

    if (subtotal < coupon.minPurchase) {
      return res.json({
        success: false,
        message: `Minimum purchase ₹${coupon.minPurchase}`,
      });
    }

    let discount = 0;

    if (coupon.discountType === "PERCENT") {
      discount = Math.round(subtotal * (coupon.discountValue / 100));
      if (coupon.maxDiscount) {
        discount = Math.min(discount, coupon.maxDiscount);
      }
    } else {
      discount = coupon.discountValue;
    }

    req.session.appliedCoupon = {
      id: coupon._id,
      code: coupon.code,
      discount,
    };

    return res.json({
      success: true,
      discount,
      code: coupon.code,
    });
  } catch (error) {
    console.error("Apply coupon error:", error.message);
    res.status(500).json({ success: false });
  }
};

export const removeCoupon = (req, res) => {
  req.session.appliedCoupon = null;
  res.json({ success: true });
};
