import Wishlist from "../models/wishlistModel.js";

export const injectWishlistCount = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.wishlistCount = 0;
      return next();
    }

    const wishlist = await Wishlist.findOne({
      userId: req.session.user._id,
    });

    res.locals.wishlistCount = wishlist?.products.length || 0;

    next();
  } catch (err) {
    res.locals.wishlistCount = 0;
    next();
  }
};
