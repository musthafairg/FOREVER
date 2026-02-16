
import mongoose, { Schema } from "mongoose";

const reviewSchema = new mongoose.Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    rating: {
        type: Number,
        min: 1,
        max: 5,
        required: true
    },
    comment: {
        type: String,
        trim: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const variantsSchema = new mongoose.Schema({
    size: {
        type: String,
        enum: ["XS", "S", "M", "L", "XL", "XXL"],
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 0
    },
    price: {
        type: Number,
        required: true,
        min: 0
    }
});

const productSchema = new mongoose.Schema(
    {
        productName: {
            type: String,
            required: true,
        },
        description: {
            type: String,
            required: true,
        },
    
        category: {
            type: Schema.Types.ObjectId,
            ref: "Category",
            required: true,
        },
        regularPrice: {
            type: Number,
            required: true,
        },
        productOffer: {
            type: Number,
            default: 0
        },
        productImage: {
            type: [String],
            required: true,
        },
        isBlocked: {
            type: Boolean,
            default: false,
        },
        status: {
            type: String,
            enum: ["Available", "Out of stock", "Discontinued"],
            required: true,
            default: "Available"
        },

        highlights: {
            type: [String],
            default: []
        },
        specifications: {
            type: Object,
            default: {}
        },

        reviews: [reviewSchema],
        avgRating: {
            type: Number,
            default: 0
        },
        variants: [variantsSchema],


    },
    { timestamps: true }
);

const Product = mongoose.model("Product", productSchema);
export default Product;
