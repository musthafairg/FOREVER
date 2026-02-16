import Cart from "../models/cartModel.js";

export const injectCartCount = async (req, res, next) => {
    try {
        if (!req.session.user) {
            res.locals.cartCount = 0;
            return next();
        }
        const cart = await Cart.findOne({
            userId: req.session.user._id,
        });

        res.locals.cartCount = cart?.items.length || 0;
        next();
    } catch (err) {
        res.locals.cartCount = 0;
        next();
    }
};
