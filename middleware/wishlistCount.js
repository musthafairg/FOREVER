import Wishlist from "../models/wishlistModel.js";

export const injectWishlistData = async (req, res, next) => {
  try {
    if (!req.session.user) {
      res.locals.wishlistCount = 0;
      res.locals.wishlistItems = [];
      return next();
    }

    const wishlist = await Wishlist.findOne({
      userId: req.session.user._id,
    });

    res.locals.wishlistCount = wishlist?.products.length || 0;


    res.locals.wishlistItems = wishlist
      ? wishlist.products.map(id => id.toString())
      : [];

    next();
  } catch (err) {
    res.locals.wishlistCount = 0;
    res.locals.wishlistItems = [];
    next();
  }
};
