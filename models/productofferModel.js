
import mongoose, { Schema } from "mongoose";

const productOfferSchema = new Schema({
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Product",
    unique: true,
    required: true
  },
  discount: {
    type: Number,
    min: 1,
    max: 90,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, { timestamps: true });


const ProductOffer = mongoose.model("ProductOffer", productOfferSchema);
export default ProductOffer;
