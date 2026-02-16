import Order from "../../models/orderModel.js";
import User from "../../models/userModel.js";
import Product from "../../models/productModel.js";
import { creditWallet } from "../../utils/walletUtils.js";

const recalculateOrderSummary = (order) => {
  const activeItems = order.items.filter((i) => !i.isCancelled && !i.refunded);

  const subtotal = activeItems.reduce((sum, i) => sum + i.itemTotal, 0);

  const tax = Math.round(subtotal * 0.05);

  let discount = 0;
  const originalSubtotal = order.items.reduce((sum, i) => sum + i.itemTotal, 0);

  if (originalSubtotal > 0 && order.priceDetails.discount > 0) {
    discount = Math.round(
      (subtotal / originalSubtotal) * order.priceDetails.discount,
    );
  }

  let total = subtotal + tax + order.priceDetails.shipping - discount;
  if (total < 0) total = 0;

  order.priceDetails.subtotal = subtotal;
  order.priceDetails.tax = tax;
  order.priceDetails.discount = discount;
  order.priceDetails.total = total;

  return total;
};

export const loadAdminOrders = async (req, res) => {
  try {
    const { search = "", status = "", page = 1, sort = "latest" } = req.query;

    const limit = 8;
    const skip = (page - 1) * limit;

    let query = {};

    if (search) {
      const users = await User.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ],
      }).select("_id");

      query.$or = [
        { orderId: { $regex: search, $options: "i" } },
        { userId: { $in: users.map((u) => u._id) } },
      ];
    }

    if (status) {
      query.orderStatus = status;
    }

    let sortOption = { createdAt: -1 };
    if (sort === "oldest") sortOption = { createdAt: 1 };
    if (sort === "amount") sortOption = { "priceDetails.total": -1 };

    const totalOrders = await Order.countDocuments(query);

    const totalPages = Math.ceil(totalOrders / limit);
    const orders = await Order.find(query)
      .populate("userId", "name email")
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.render("admin/orders", {
      orders,
      currentPage: Number(page),
      totalPages,
      search,
      status,
      sort,
    });
  } catch (error) {
    console.error("Admin order list eror : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "orders",
    });
  }
};

export const loadAdminOrderDetail = async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.id }).populate(
      "userId",
      "name email",
    );

    if (!order) return res.redirect("/admin/orders");

    res.render("admin/order-details", { order });
  } catch (error) {
    console.error("Admin order detail error: ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "orders",
    });
  }
};

export const updateOrderStatus = async (req, res) => {
  try {
    const { status } = req.body;

    await Order.updateOne({ orderId: req.params.id }, { orderStatus: status });

    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    console.error("Update order status error : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "orders",
    });
  }
};

export const deleteOrder = async (req, res) => {
  try {
    await Order.deleteOne({ orderId: req.params.id });
    res.redirect("/admin/orders");
  } catch (error) {
    console.error("Delete order error : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "orders",
    });
  }
};

export const updateReturnStatus = async (req, res) => {
  try {
    const { status } = req.body;

    const order = await Order.findOne({ orderId: req.params.id });

    if (!order) {
      return res.redirect("/admin/orders");
    }

    if (order.paymentStatus !== "PAID") {
      return res.redirect(`/admin/orders/${id}`);
    }

    if (status === "APPROVED") {
      if (order.isFullyRefunded) {
        return res.redirect(`/admin/orders/${req.params.id}`);
      }
      const refundAmount = order.priceDetails.total;

      for (const item of order.items) {
        if (!item.refunded && !item.isCancelled) {
          const product = await Product.findById(item.productId);
          const variant = product.variants.find((v) => v.size === item.size);

          if (variant) {
            variant.quantity += item.quantity;
            await product.save();
          }

          item.refunded = true;
          item.returnStatus = "APPROVED";
        }
      }

      if (refundAmount > 0 && order.paymentMethod !== "COD") {
        await creditWallet(
          order.userId,
          refundAmount,
          `Refund for returned Order ${order.orderId}`,
        );
      }

      order.priceDetails.subtotal = 0;
      order.priceDetails.tax = 0;
      order.priceDetails.total = 0;

      order.orderStatus = "Returned";
      order.returnStatus = "APPROVED";
      order.isFullyRefunded = true;

      await order.save();
    }

    res.redirect(`/admin/orders/${req.params.id}`);
  } catch (error) {
    console.error("Update return status error : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "orders",
    });
  }
};

export const updateReturnItemStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const { id, productId } = req.params;

    const order = await Order.findOne({ orderId: id });
    if (!order) return res.redirect("/admin/orders");

    if (order.isFullyRefunded) {
      return res.redirect(`/admin/orders/${id}`);
    }
    if (order.paymentStatus !== "PAID") {
      return res.redirect(`/admin/orders/${id}`);
    }

    const item = order.items.find((i) => i.productId.toString() === productId);

    if (
      !item ||
      item.refunded ||
      item.isCancelled ||
      item.returnStatus !== "REQUESTED"
    ) {
      return res.redirect(`/admin/orders/${id}`);
    }

    if (status === "APPROVED") {
      if (item.refunded) {
        return res.redirect(`/admin/orders/${id}`);
      }

      const product = await Product.findById(item.productId);
      const variant = product.variants.find((v) => v.size === item.size);

      if (variant) {
        variant.quantity += item.quantity;
        await product.save();
      }
      const oldTotal = order.priceDetails.total;

      item.refunded = true;
      item.returnStatus = "APPROVED";

      const newTotal = recalculateOrderSummary(order);

      const refundAmount = oldTotal - newTotal;

      if (
        refundAmount > 0 &&
        order.paymentStatus === "PAID" &&
        order.paymentMethod !== "COD"
      ) {
        await creditWallet(
          order.userId,
          refundAmount,
          `Refund for returned item ${item.productName} (Order ${order.orderId})`,
        );
      }

      const remainingItems = order.items.filter(
        (i) => !i.isCancelled && !i.refunded,
      );

      if (remainingItems.length === 0) {
        order.orderStatus = "Returned";
        order.isFullyRefunded = true;
      } else {
        order.orderStatus = "Delivered";
      }

      await order.save();
    }

    if (status === "REJECTED") {
      item.returnStatus = "REJECTED";
      order.returnStatus = "REJECTED";
      await order.save();
    }

    res.redirect(`/admin/orders/${id}`);
  } catch (error) {
    console.error("Update return item status error:", error.message);
    res.status(500).render("admin/errors/500", { page: "orders" });
  }
};
