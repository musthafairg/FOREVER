import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import ProductOffer from "../../models/productofferModel.js";
import CategoryOffer from "../../models/categoryofferModel.js";


export const loadProductOffers = async (req, res) => {
  try {
    const products = await Product.find({ isBlocked: false });

    const offers = await ProductOffer.find()
      .populate("productId")
      .lean();


    const validOffers = offers.filter(o => o.productId);

    res.render("admin/product-offers", {
      page: "offers",
      products,
      offers: validOffers,
    });

  } catch (error) {
    console.error("Load Product Offers Error:", error.message);
    res.status(500).render("admin/errors/500", { page: "offers" });
  }
};


export const addProductOffer = async (req, res) => {
  try {
    const { productId, discount } = req.body;

    if (!productId || !discount || discount <= 0 || discount > 90) {
      return res.json({
        success: false,
        errors: {
          discount: "Discount must be between 1 and 90%",
        },
      });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({
        success: false,
        errors: { productId: "Product not found" },
      });
    }

    const offer = await ProductOffer.findOneAndUpdate(
      { productId },
      { discount, isActive: true },
      { upsert: true, new: true }
    ).populate("productId");

    res.json({
      success: true,
      offer: {
        id: offer._id,
        productName: offer.productId.productName,
        discount: offer.discount,
        isActive: offer.isActive,
      },
    });

  } catch (error) {
    console.error("Add Product Offer Error:", error.message);
    res.status(500).json({ success: false });
  }
};


export const toggleProductOffer = async (req, res) => {
  try {
    const offer = await ProductOffer.findById(req.params.id);

    if (!offer) {
      return res.json({ success: false });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.json({
      success: true,
      isActive: offer.isActive,
    });

  } catch (error) {
    console.error("Toggle Product Offer Error:", error.message);
    res.status(500).json({ success: false });
  }
};




export const loadCategoryOffers = async (req, res) => {
  try {
    const categories = await Category.find({ isListed: true });

    const offers = await CategoryOffer.find()
      .populate("categoryId")
      .lean();

    const validOffers = offers.filter(o => o.categoryId);

    res.render("admin/category-offers", {
      page: "offers",
      categories,
      offers: validOffers,
    });

  } catch (error) {
    console.error("Load Category Offers Error:", error.message);
    res.status(500).render("admin/errors/500", { page: "offers" });
  }
};


export const addCategoryOffer = async (req, res) => {
  try {
    const { categoryId, discount } = req.body;

    if (!categoryId || !discount || discount <= 0 || discount > 90) {
      return res.json({
        success: false,
        errors: {
          discount: "Discount must be between 1 and 90%",
        },
      });
    }

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.json({
        success: false,
        errors: { categoryId: "Category not found" },
      });
    }

    const offer = await CategoryOffer.findOneAndUpdate(
      { categoryId },
      { discount, isActive: true },
      { upsert: true, new: true }
    ).populate("categoryId");

    res.json({
      success: true,
      offer: {
        id: offer._id,
        categoryName: offer.categoryId.name,
        discount: offer.discount,
        isActive: offer.isActive,
      },
    });

  } catch (error) {
    console.error("Add Category Offer Error:", error.message);
    res.status(500).json({ success: false });
  }
};


export const toggleCategoryOffer = async (req, res) => {
  try {
    const offer = await CategoryOffer.findById(req.params.id);

    if (!offer) {
      return res.json({ success: false });
    }

    offer.isActive = !offer.isActive;
    await offer.save();

    res.json({
      success: true,
      isActive: offer.isActive,
    });

  } catch (error) {
    console.error("Toggle Category Offer Error:", error.message);
    res.status(500).json({ success: false });
  }
};
