import Wishlist from "../../models/wishlistModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import { applyBestOffer } from "../../utils/applyBestOffer.js";

export const loadWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    const wishlist = await Wishlist.findOne({ userId }).populate({
      path: "products",
      populate: { path: "category" },
    });

    if (!wishlist || wishlist.products.length === 0) {
      return res.render("user/wishlist", {
        user,
        products: [],
      });
    }

    const validProducts = wishlist.products.filter(
      (p) => p && !p.isBlocked && p.status === "Available",
    );

    const productsWithOffer = await Promise.all(
      validProducts.map(async (product) => {
        const offerData = await applyBestOffer(product);

        return {
          ...product.toObject(),
          finalPrice: offerData.finalPrice,
          discountPercent: offerData.discountPercent,
        };
      }),
    );

    res.render("user/wishlist", {
      user,
      products: productsWithOffer,
    });
  } catch (error) {
    console.error("Load wishlist error:", error.message);
    res.status(500).send("Server error");
  }
};

export const addToWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.body;

    let wishlist = await Wishlist.findOne({ userId });

    if (!wishlist) {
      wishlist = new Wishlist({
        userId,
        products: [productId],
      });
    } else {
      const exists = wishlist.products.some((p) => p.toString() === productId);

      if (exists) {
        wishlist.products.pull(productId);
      } else {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Add to wishlist  error :", error.message);
    res.status(500).json({ success: false });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.body;

    await Wishlist.updateOne({ userId }, { $pull: { products: productId } });

    res.json({ success: true });
  } catch (error) {
    console.error("Remove Wishlist error :", error.message);
    res.status(500).json({ success: false });
  }
};
