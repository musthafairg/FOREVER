import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";

import { applyBestOffer } from "../../utils/applyBestOffer.js";

export const getProductDetailsPage = async (req, res) => {
  try {
    const user = req.session.user;
    const id = req.query.id;

    const category = await Category.find({ isListed: true });

    const product = await Product.findById(id).populate("category").populate({
      path: "reviews.user",
      select: "name email",
    });

    if (!product || product.isBlocked || product.status === "Discontinued") {
      return res.status(404).render("errors/product-not-found",{
        page:"shop",
        user

      })
    }

    const offerData = await applyBestOffer(product);

    const latestreviews = product.reviews.reverse().slice(0, 6);

    const relatedProducts = await Product.find({
      category: product.category._id,
      _id: { $ne: product._id },
      isBlocked: false,
      status: "Available",
    }).limit(5);

    res.render("user/productDetails", {
      product,
      offerData,
      category: category,
      user,
      latestreviews,
      relatedProducts,
    });
  } catch (error) {
    console.error("Error fetching product details: ", error.message);
    return res.status(500).render("errors/500");
  }
};

export const addReview = async (req, res) => {
  try {
    const userId = req.session.user?._id;
    if (!userId) {
      return res.redirect("/login");
    }

    const { productId, rating, comment } = req.body;

    const product = await Product.findById(productId);

    if (!product || product.isBlocked || product.status === "Discontinued") {
      return res.status(404).render("errors/product-not-found");
    }

    product.reviews.push({
      user: userId,
      rating: Number(rating),
      comment,
    });

    const totalRating = product.reviews.reduce((sum, r) => sum + r.rating, 0);
    product.avgRating = totalRating / product.reviews.length;

    await product.save();

    return res.redirect(`/product-details?id=${productId}`);
  } catch (error) {
    console.error("Error adding Review :", error.message);
    return res.status(500).render("errors/500");
  }
};

export const filterByPrice = async (req, res) => {
  try {
    const user = req.session.user;

    const gt = Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt;
    const lt = Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt;

    const categoryId = req.query.category;
    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }

    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }
    let sort = "";
    if (req.query.sort) {
      sort = req.query.sort;
    }

    let limit = 9;

    let skip = (page - 1) * limit;

    const baseQuery = {
      isBlocked: false,
      productName: { $regex: search, $options: "i" },
    };

    if (categoryId) baseQuery.category = categoryId;

    let products = await Product.find(baseQuery).populate("category").lean();

    const productsWithOffer = await Promise.all(
      products.map(async (p) => {
        const offer = await applyBestOffer(p);
        return {
          ...p,
          finalPrice: offer.finalPrice,
          discountPercent: offer.discountPercent,
        };
      }),
    );

    const filtered = productsWithOffer.filter(
      (p) => p.finalPrice >= gt && p.finalPrice <= lt,
    );

    if (sort === "priceLow")
      filtered.sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === "priceHigh")
      filtered.sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === "az")
      filtered.sort((a, b) => a.productName.localeCompare(b.productName));
    if (sort === "za")
      filtered.sort((a, b) => b.productName.localeCompare(a.productName));

    const totalProducts = filtered.length;
    const totalPages = Math.ceil(totalProducts / limit);
    const paginatedProducts = filtered.slice(skip, skip + limit);

    const category = await Category.find({ isListed: true });

    res.render("user/shop", {
      products: paginatedProducts,
      currentPage: page,
      totalPages,
      search,
      category,
      sort,
      categoryId,
      gt: Number(gt),
      lt: Number(lt),
      user,
    });
  } catch (error) {
    console.error("Error in Filter By Price :", error.message);

    res.status(500).render("errors/500");
  }
};

export const filter = async (req, res) => {
  try {
    const user = req.session.user;

    const categoryId = req.query.category;

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    let sort = "";
    if (req.query.sort) {
      sort = req.query.sort;
    }

    const gt = Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt;
    const lt = Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt;

    let limit = 9;
    let skip = (page - 1) * limit;

    const query = {
      isBlocked: false,
      productName: { $regex: search, $options: "i" },
    };

    if (categoryId) query.category = categoryId;

    let products = await Product.find(query).populate("category").lean();

    const productsWithOffer = await Promise.all(
      products.map(async (p) => {
        const offer = await applyBestOffer(p);
        return {
          ...p,
          finalPrice: offer.finalPrice,
          discountPercent: offer.discountPercent,
        };
      }),
    );

    if (sort === "priceLow")
      productsWithOffer.sort((a, b) => a.finalPrice - b.finalPrice);
    if (sort === "priceHigh")
      productsWithOffer.sort((a, b) => b.finalPrice - a.finalPrice);
    if (sort === "az")
      productsWithOffer.sort((a, b) =>
        a.productName.localeCompare(b.productName),
      );
    if (sort === "za")
      productsWithOffer.sort((a, b) =>
        b.productName.localeCompare(a.productName),
      );

    const totalProducts = productsWithOffer.length;
    const totalPages = Math.ceil(totalProducts / limit);

    const paginated = productsWithOffer.slice(skip, skip + limit);

    const category = await Category.find({ isListed: true });

    res.render("user/shop", {
      products: paginated,
      currentPage: page,
      totalPages,
      category,
      search,
      sort,
      categoryId,
      gt,
      lt,
      user,
    });
  } catch (error) {
    console.error("Error in filter :", error.message);
    res.status(500).render("errors/500");
  }
};
