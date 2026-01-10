
import mongoose ,{Schema} from "mongoose";

const categoryOfferSchema = new Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
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


const CategoryOffer =mongoose.model("CategoryOffer", categoryOfferSchema);
export default CategoryOffer;
