import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";

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
    console.error("Dashboard Load Error:", error.message);
    res.status(500).render("admin/errors/500", {
      page: "dashboard",
    });
  }
};
export const getDashboardData = async (req, res) => {
  try {
    const filter = req.query.filter || "monthly";
    const now = new Date();

    let startDate;
    let groupStage;
    let labels = [];

    if (filter === "weekly") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 6);

      groupStage = {
        $dateToString: { format: "%Y-%m-%d", date: "$createdAt" },
      };

      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(now.getDate() - i);
        labels.push(d.toISOString().slice(0, 10));
      }
    } else if (filter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);

      groupStage = { $month: "$createdAt" };
      labels = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);

      groupStage = { $dayOfMonth: "$createdAt" };
      const daysInMonth = new Date(
        now.getFullYear(),
        now.getMonth() + 1,
        0,
      ).getDate();

      labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);
    }

    const matchStage = {
      orderStatus: "Delivered",
      paymentStatus: "PAID",
      createdAt: { $gte: startDate },
    };

    const rawSales = await Order.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: groupStage,
          total: { $sum: "$priceDetails.total" },
        },
      },
    ]);

    const salesMap = {};
    rawSales.forEach((s) => {
      salesMap[s._id] = s.total;
    });

    const sales = labels.map((l) => ({
      _id: l,
      total: salesMap[l] || 0,
    }));

    const bestProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      { $match: { "items.isCancelled": false } },
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

    const bestCategories = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      { $match: { "items.isCancelled": false } },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.category",
          sold: { $sum: "$items.quantity" },
        },
      },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
    ]);

    const recentOrders = await Order.find(matchStage)
      .populate("userId", "name")
      .sort({ createdAt: -1 })
      .limit(5);

    res.json({
      success: true,
      sales,
      bestProducts,
      bestCategories,
      recentOrders,
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error);
    res.status(500).json({ success: false }).render("admin/errors/500", {
      page: "dashboard",
    });
  }
};
