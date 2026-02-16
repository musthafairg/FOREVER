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
      (p) => p && !p.isBlocked && p.status === "Available"
    );

    const productsWithOffer = await Promise.all(
      validProducts.map(async (product) => {

        const baseOffer = await applyBestOffer(product);
        const discountPercent = baseOffer.discountPercent || 0;


        const updatedVariants = product.variants.map(v => {

          const finalPrice =
            discountPercent > 0
              ? Math.round(v.price - (v.price * discountPercent) / 100)
              : v.price;

          return {
            ...v.toObject(),
            originalPrice: v.price,
            finalPrice,
            discountPercent
          };
        });

      
        const minVariant = updatedVariants.reduce((min, v) =>
          v.finalPrice < min.finalPrice ? v : min
        );

        return {
          ...product.toObject(),
          variants: updatedVariants,
          finalPrice: minVariant.finalPrice,
          discountPercent,
        };
      })
    );

    res.render("user/wishlist", {
      user,
      products: productsWithOffer,
    });

  } catch (error) {
    console.error("Load wishlist error:", error.message);
    return res.status(500).render("errors/500");
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

      const exists = wishlist.products.some(
        (p) => p.toString() === productId
      );

      if (exists) {
        wishlist.products.pull(productId);
      } else {
        wishlist.products.push(productId);
      }
    }

    await wishlist.save();

    return res.json({ success: true });

  } catch (error) {
    console.error("Add to wishlist error:", error.message);
    return res.status(500).json({ success: false });
  }
};

export const removeFromWishlist = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId } = req.body;

    await Wishlist.updateOne(
      { userId },
      { $pull: { products: productId } }
    );

    return res.json({ success: true });

  } catch (error) {
    console.error("Remove wishlist error:", error.message);
    return res.status(500).json({ success: false });
  }
};
