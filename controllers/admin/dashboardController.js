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
      { $group: { _id: null, total: { $sum: "$priceDetails.total" } } }
    ]);

    res.render("admin/dashboard", {
      page: "dashboard",
      stats: {
        totalProducts,
        totalCustomers,
        totalOrders,
        totalRevenue: revenue[0]?.total || 0
      }
    });
  } catch (error) {
    console.error("Dashboard Load Error:", error.message);
    res.status(500).send("Server Error");
  }
};

export const getDashboardData = async (req, res) => {
  try {
    const filter = req.query.filter || "monthly";
    const now = new Date();
    let startDate, groupId;

    if (filter === "weekly") {
      startDate = new Date();
      startDate.setDate(now.getDate() - 7);
      groupId = { $dayOfWeek: "$createdAt" };
    } else if (filter === "yearly") {
      startDate = new Date(now.getFullYear(), 0, 1);
      groupId = { $month: "$createdAt" };
    } else {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      groupId = { $dayOfMonth: "$createdAt" };
    }

    const matchStage = {
      orderStatus: "Delivered",
      paymentStatus: "PAID",
      createdAt: { $gte: startDate }
    };

    const sales = await Order.aggregate([
      { $match: matchStage },
      { $group: { _id: groupId, total: { $sum: "$priceDetails.total" } } },
      { $sort: { _id: 1 } }
    ]);

    const bestProducts = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      { $group: { _id: "$items.productId", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "products",
          localField: "_id",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" }
    ]);

    const bestCategories = await Order.aggregate([
      { $match: matchStage },
      { $unwind: "$items" },
      {
        $lookup: {
          from: "products",
          localField: "items.productId",
          foreignField: "_id",
          as: "product"
        }
      },
      { $unwind: "$product" },
      { $group: { _id: "$product.category", sold: { $sum: "$items.quantity" } } },
      { $sort: { sold: -1 } },
      { $limit: 5 },
      {
        $lookup: {
          from: "categories",
          localField: "_id",
          foreignField: "_id",
          as: "category"
        }
      },
      { $unwind: "$category" }
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
      recentOrders
    });
  } catch (error) {
    console.error("Dashboard Data Error:", error.message);
    res.status(500).json({ success: false });
  }
};
