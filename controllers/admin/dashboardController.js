import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import Category from "../../models/categoryModel.js";

export const loadDashboard = async (req, res) => {
  try {
    const totalProducts = await Product.countDocuments({ isBlocked: false });
    const totalCustomers = await User.countDocuments({ isAdmin: false });
    const totalOrders = await Order.countDocuments();

    const revenue = await Order.aggregate([
      { $match: { orderStatus: "Delivered", paymentStatus: "PAID" } },
      { $group: { _id: null, total: { $sum: "$priceDetails.total" } } },
    ]);

    res.render("admin/dashboard", {
      page: "dashboard",
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue: revenue[0]?.total || 0,
      },
    });
  } catch (error) {
    console.error("Dashboard load error:", error.message);
    res.status(500).send("Server Error");
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const filter = req.query.filter || "monthly";
    const now = new Date();
    let startDate;

    if (filter === "weekly") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
    } else if (filter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
    }

    const matchStage = {
      orderStatus: "Delivered",
      paymentStatus: "PAID",
      createdAt: { $gte: startDate },
    };

    const sales = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: { $dayOfMonth: "$createdAt" },
          total: { $sum: "$priceDetails.total" },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    const bestProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $group: {
          _id: "$items.productId",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ]);

    const recentOrders = await Order.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .populate("userId");

    res.json({
      success: true,
      sales,
      bestProducts,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard data error:", error.message);
    res.status(500).json({ success: false });
  }
};
