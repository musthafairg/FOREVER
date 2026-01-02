import Product from "../../models/productModel.js";

/* ---------------- LOAD STOCK PAGE ---------------- */
export const loadStockPage = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";

    const query = {
      productName: { $regex: search, $options: "i" }
    };

    const total = await Product.countDocuments(query);
    const products = await Product.find(query)
      .sort({ updatedAt: -1 })
      .skip(skip)
      .limit(limit);

    res.render("admin/stock", {
      products,
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      search,
      page: "stock"
    });

  } catch (error) {
    console.error("Load stock error:", error.message);
    res.status(500).send("Server Error");
  }
};

/* ---------------- UPDATE STOCK (AJAX) ---------------- */
export const updateStock = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity } = req.body;

    const product = await Product.findById(id);
    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found"
      });
    }

    product.quantity = quantity;
    product.status = quantity === 0 ? "Out of stock" : "Available";

    await product.save();

    res.json({
      success: true,
      quantity: product.quantity,
      status: product.status
    });

  } catch (error) {
    console.error("Update stock error:", error.message);
    res.status(500).json({ success: false });
  }
};
