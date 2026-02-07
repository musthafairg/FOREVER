import Coupon from "../../models/couponModel.js";

export const loadCoupons = async (req, res) => {
  const coupons = await Coupon.find().sort({ createdAt: -1 });
  res.render("admin/coupons", { coupons });
};

export const getCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  res.json(coupon);
};

export const createCoupon = async (req, res) => {
  const code = req.body.code.toUpperCase();

  const exists = await Coupon.findOne({ code });
  if (exists) {
    return res.json({ success: false, errors: { code: "Already exists" } });
  }

  const coupon = await Coupon.create({ ...req.body, code });
  res.json({ success: true, coupon });
};

export const updateCoupon = async (req, res) => {
  await Coupon.findByIdAndUpdate(req.params.id, {
    ...req.body,
    code: req.body.code.toUpperCase(),
  });

  res.json({ success: true });
};

export const toggleCoupon = async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);
  coupon.isActive = !coupon.isActive;
  await coupon.save();
  res.json({ success: true, isActive: coupon.isActive });
};

export const deleteCoupon = async (req, res) => {
  await Coupon.findByIdAndDelete(req.params.id);
  res.json({ success: true });
};
