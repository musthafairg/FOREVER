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
    console.error("Dashboard load error:", error.message);
    res.status(500).send("Server Error");
  }
};

