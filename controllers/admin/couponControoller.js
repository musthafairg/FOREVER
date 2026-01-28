import Coupon from "../../models/couponModel.js";

export const loadCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find().sort({ createdAt: -1 });

    res.render("admin/coupons", {
      page: "offers",
      coupons,
    });
  } catch (error) {
    console.error("Load Coupons Error:", error.message);
    res.status(500).send("Server Error");
  }
};

export const createCoupon = async (req, res) => {
  try {
    let {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
    } = req.body;

    code = code.toUpperCase();

    const exists = await Coupon.findOne({ code });
    if (exists) {
      return res.json({
        success: false,
        errors: { code: "Coupon already exists" },
      });
    }

    const coupon = await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
    });

    res.json({
      success: true,
      coupon,
    });
  } catch (error) {
    console.error("Create Coupon Error:", error.message);
    res.status(500).json({ success: false });
  }
};

export const toggleCoupon = async (req, res) => {
  try {
    const coupon = await Coupon.findById(req.params.id);
    if (!coupon) return res.json({ success: false });

    coupon.isActive = !coupon.isActive;
    await coupon.save();

    res.json({
      success: true,
      isActive: coupon.isActive,
    });
  } catch (error) {
    console.error("Toggle Coupon Error:", error.message);
    res.status(500).json({ success: false });
  }
};

export const deleteCoupon = async (req, res) => {
  try {
    await Coupon.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    console.error("Delete Coupon Error:", error.message);
    res.status(500).json({ success: false });
  }
};
