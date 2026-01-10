import mongoose , {Schema}from "mongoose";

const couponSchema = new Schema(
  {
    code: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    discountType: {
      type: String,
      enum: ["PERCENT", "FLAT"],
      required: true
    },
    discountValue: {
      type: Number,
      required: true
    },
    minPurchase: {
      type: Number,
      default: 0
    },
    maxDiscount: {
      type: Number
    },
    expiryDate: {
      type: Date,
      required: true
    },
    usageLimit: {
      type: Number,
      default: 1
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  { timestamps: true }
);


const Coupon= mongoose.model("Coupon", couponSchema);
export default Coupon;
