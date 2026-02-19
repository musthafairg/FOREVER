import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import User from "../../models/userModel.js";
import { applyBestOffer } from "../../utils/applyBestOffer.js";
const Max_QUANTITY_PER_PRODUCT = 5;
export const loadCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.redirect("/login");
    }

    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart || cart.items.length === 0) {
      return res.render("user/cart", {
        user,
        cart: null,
        subtotal: 0,
        hasInvalidItems: false,
      });
    }

    let subtotal = 0;
    let hasInvalidItems = false;

    const cartItemsWithOffer = await Promise.all(
      cart.items.map(async (item) => {
        const product = item.productId;

        let isBlocked = false;
        let stockIssue = false;

        if (!product || product.isBlocked || product.status !== "Available") {
          isBlocked = true;
          hasInvalidItems = true;
        }

        const selectedVariant = product?.variants?.find(
          (v) => v.size === item.size
        );

        if (!selectedVariant || selectedVariant.quantity < item.quantity) {
          stockIssue = true;
          hasInvalidItems = true;
        }

        let originalPrice = selectedVariant?.price || 0;
        let discountPercent = 0;
        let finalPrice = originalPrice;

        if (!isBlocked && !stockIssue) {
          const offer = await applyBestOffer(product);
          discountPercent = offer.discountPercent || 0;

          finalPrice =
            discountPercent > 0
              ? Math.round(
                  originalPrice - (originalPrice * discountPercent) / 100
                )
              : originalPrice;

          subtotal += finalPrice * item.quantity;
        }

        return {
          ...item.toObject(),
          finalPrice,
          originalPrice,
          discountPercent,
          isBlocked,
          stockIssue,
        };
      })
    );

    res.render("user/cart", {
      user,
      cart: { ...cart.toObject(), items: cartItemsWithOffer },
      subtotal,
      hasInvalidItems,
    });
  } catch (error) {
    console.error("Load cart error:", error.message);
    res.status(500).render("errors/500");
  }
};

export const addToCart = async (req, res) => {
  try {
    if (!req.session.user) {
      return res.status(401).json({
        success: false,
        message: "Please login first",
        redirect: "/login",
      })
    }

    const userId = req.session.user._id;
    const { productId, quantity = 1, size } = req.body;

    const product = await Product.findById(productId);

    if (!product || product.isBlocked || product.status !== "Available") {
      return res.json({
        success: false,
        message: "Product unavailable",
      });
    }

    if (!size) {
      return res.json({
        success: false,
        message: "Please select a size",
      });
    }

    const selectedVariant = product.variants.find((v) => v.size === size);

    if (!selectedVariant || selectedVariant.quantity <= 0) {
      return res.json({
        success: false,
        message: "Selected size out of stock",
      });
    }

    if (quantity > selectedVariant.quantity) {
      return res.json({
        success: false,
        message: "Not enough stock",
      });
    }

    if (quantity > Max_QUANTITY_PER_PRODUCT) {
      return res.json({
        success: false,
        message: "Maximum limit reached",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [],
      });
    }

    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId && item.size === size,
    );

    if (existingItem) {
      const newQuantity = existingItem.quantity + quantity;

      if (
        newQuantity > selectedVariant.quantity ||
        newQuantity > Max_QUANTITY_PER_PRODUCT
      ) {
        return res.json({
          success: false,
          message: "Quantity exceeds limit",
        });
      }

      existingItem.quantity = newQuantity;
    } else {
      cart.items.push({
        productId,
        size,
        quantity,
        price: selectedVariant.price,
      });
    }

    await cart.save();

    return res.json({
      success: true,
      message: "Added to cart",
    });
  } catch (error) {
    console.error("Add to cart error:", error);
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const updateCartQuantity = async (req, res) => {
  try {
    const { productId, size, action } = req.body;
    const userId = req.session.user._id;

    const cart = await Cart.findOne({ userId });
    if (!cart) return res.json({ success: false, message: "Cart not found" });

    const item = cart.items.find(
      (i) => i.productId.toString() === productId && i.size === size,
    );

    if (!item) return res.json({ success: false, message: "Item not found" });

    const product = await Product.findById(productId);

    const selectedVariant = product.variants.find((v) => v.size === size);

    if (!selectedVariant)
      return res.json({ success: false, message: "Size not found" });

    if (action === "inc") {
      if (item.quantity >= Max_QUANTITY_PER_PRODUCT)
        return res.json({ success: false, message: "Limit reached" });

      if (item.quantity >= selectedVariant.quantity)
        return res.json({ success: false, message: "Out of stock" });

      item.quantity++;
    }

    if (action === "dec" && item.quantity > 1) {
      item.quantity--;
    }

    await cart.save();

    return res.json({
      success: true,
      quantity: item.quantity,
    });
  } catch (error) {
    console.error("Update cart qty error:", error);
    return res.status(500).json({ success: false });
  }
};
export const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId, size } = req.body;

    await Cart.updateOne({ userId }, { $pull: { items: { productId, size } } });

    return res.json({ success: true });
  } catch (error) {
    console.error("Remove cart item error:", error.message);
    return res.status(500).json({ success: false });
  }
};
