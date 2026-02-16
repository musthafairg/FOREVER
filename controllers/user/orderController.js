import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import PDFDocument from "pdfkit";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";
import { applyBestOffer } from "../../utils/applyBestOffer.js";
import Coupon from "../../models/couponModel.js";
import { creditWallet, debitWallet } from "../../utils/walletUtils.js";

const generateOrderId = async () => {
  const count = await Order.countDocuments();

  return `FR-${new Date().getDate()}-${String(count + 1).padStart(6, "0")}`;
};
export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    const { addressId, paymentMethod } = req.body;

    const couponData = req.session.appliedCoupon;
    let couponDiscount = couponData ? couponData.discount : 0;

    const cart = await Cart.findOne({ userId }).populate({
      path: "items.productId",
      populate: { path: "category" },
    });

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart empty" });
    }

    for (const item of cart.items) {
      const product = item.productId;

      if (!product || product.isBlocked || product.status !== "Available") {
        return res.json({
          success: false,
          message: "Invalid cart items",
        });
      }

      const variant = product.variants.find((v) => v.size === item.size);

      if (!variant || variant.quantity < item.quantity) {
        return res.json({
          success: false,
          message: `Insufficient stock for ${product.productName} (${item.size})`,
        });
      }
    }

    const addressData = await Address.findOne({ userId });
    const selectedAddress = addressData.address.find(
      (a) => a._id.toString() === addressId,
    );

    if (!selectedAddress) {
      return res.json({ success: false, message: "Invalid address" });
    }

    let subtotal = 0;

    const items = await Promise.all(
      cart.items.map(async (i) => {
        const offer = await applyBestOffer(i.productId);

        const itemTotal = offer.finalPrice * i.quantity;
        subtotal += itemTotal;

        return {
          productId: i.productId._id,
          productName: i.productId.productName,
          productImage: i.productId.productImage[0],
          size: i.size,
          price: i.productId.regularPrice,
          offerPrice: offer.finalPrice,
          quantity: i.quantity,
          itemTotal,
          discountPercent: offer.discountPercent,
        };
      }),
    );

    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax - couponDiscount;

    if (paymentMethod === "WALLET" && user.wallet.balance < total) {
      return res.json({
        success: false,
        message: "Insufficient wallet balance",
      });
    }

    const order = new Order({
      orderId: await generateOrderId(),
      userId,
      items,
      address: selectedAddress,
      priceDetails: {
        subtotal,
        tax,
        shipping: 0,
        discount: couponDiscount,
        total,
      },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PAID" : "PENDING",
      orderStatus: "Placed",
    });

    await order.save();

    if (couponData) {
      await Coupon.findByIdAndUpdate(couponData.id, {
        $inc: { usedCount: 1 },
      });
      req.session.appliedCoupon = null;
    }

    for (const i of cart.items) {
      const product = await Product.findById(i.productId._id);
      const variant = product.variants.find((v) => v.size === i.size);

      if (variant) {
        variant.quantity -= i.quantity;
      }

      await product.save();
    }

    await Cart.deleteOne({ userId });

    if (paymentMethod === "WALLET") {
      await debitWallet(userId, total, `Payment for order ${order.orderId}`);

      order.paymentStatus = "PAID";
      await order.save();

      return res.json({ success: true, redirect: "/order-success" });
    }

    if (paymentMethod === "COD") {
      return res.json({ success: true, redirect: "/order-success" });
    }

    const razorpayOrder = await razorpay.orders.create({
      amount: total * 100,
      currency: "INR",
      receipt: order.orderId,
    });

    order.razorpayOrderId = razorpayOrder.id;
    await order.save();

    res.json({
      success: true,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      key: process.env.RAZORPAY_KEY_ID,
      dbOrderId: order._id,
    });
  } catch (error) {
    console.error("Place order error:", error.message);
    res.status(500).json({ success: false });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderId,
    } = req.body;

    const generated = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(razorpay_order_id + "|" + razorpay_payment_id)
      .digest("hex");

    if (generated !== razorpay_signature) {
      await Order.findByIdAndUpdate(orderId, {
        paymentStatus: "FAILED",
        orderStatus: "Failed",
      });

      return res.json({ success: false });
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "PAID",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
      orderStatus: "Placed",
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false });
  }
};

export const loadSuccess = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    res.render("user/order-success", { user });
  } catch (error) {
    console.error("Error in load order success page: ", error.message);
    res.status(500).render("errors/500");
  }
};

export const loadFailure = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    res.render("user/order-failure", { user });
  } catch (error) {
    console.error("Error in load order failure page: ", error.message);
    res.status(500).render("errors/500");
  }
};




export const markPaymentFailed = async (req, res) => {
  try {
    const { orderId } = req.body;

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "FAILED",
      orderStatus: "Failed",
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false }).render("errors/500");
  }
};

export const loadOrders = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    const orders = await Order.find({ userId }).sort({ createdAt: -1 });

    res.render("user/orders", {
      user,
      orders,
    });
  } catch (error) {
    console.error("Error in load Orders :", error.message);
    res.status(500).render("errors/500");
  }
};

export const loadOrderDetail = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const order = await Order.findOne({
      orderId: req.params.id,
      userId,
    });

    if (!order) return res.redirect("/orders");

    const activeItems = order.items.filter((i) => !i.isCancelled);

    if (activeItems.length === 0) {
      order.priceDetails.subtotal = 0;
      order.priceDetails.tax = 0;
      order.priceDetails.discount = 0;
      order.priceDetails.total = 0;
      order.orderStatus = "Cancelled";
    }

    order
      .save()
      .then(() => {
        console.log("Order details updated successfully");
      
      })
      .catch((err) => {
        console.error("Error updating order details:", err.message);
      });

    const subtotal = activeItems.reduce((sum, i) => sum + i.itemTotal, 0);

    const tax = Math.round(subtotal * 0.05);

    const total = subtotal + tax - order.priceDetails.discount;

    res.render("user/order-details", {
      user,
      order,
      subtotal,
      tax,
      total,
    });
  } catch (error) {
    console.error("Error in load order Details :", error.message);
    res.status(500).render("errors/500");
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;

    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    if (!order) {
      return res.json({ success: false });
    }

    if (order.orderStatus === "Cancelled") {
      return res.json({ success: false, message: "Order already cancelled" });
    }

    if (order.orderStatus === "Delivered") {
      return res.json({
        success: false,
        message: "Delivered order cannot be cancelled",
      });
    }

    for (const item of order.items) {
      if (!item.isCancelled) {
        const product = await Product.findById(item.productId);

        if (!product) continue;

        const variant = product.variants.find(
          (v) => v.size?.toString() === item.size?.toString(),
        );

        if (variant) {
          variant.quantity += item.quantity;
          await product.save();
        }

        item.isCancelled = true;
        item.cancelReason = reason;
      }
    }

    order.orderStatus = "Cancelled";
    order.cancelReason = reason;

    await order.save();

    if (order.paymentMethod !== "COD" && order.paymentStatus === "PAID") {
      await creditWallet(
        req.session.user._id,
        order.priceDetails.total,
        `Refund for cancelled order ${order.orderId}`,
      );
    }

    res.json({ success: true });
  } catch (error) {
    console.error("Cancel order error:", error.message);
    res.status(500).json({ success: false });
  }
};
export const cancelOrderItem = async (req, res) => {
  try {
    const { productId, reason } = req.body;

    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    if (!order) return res.json({ success: false });

    const item = order.items.find(
      (i) => i.productId.toString() === productId
    );

    if (!item || item.isCancelled) {
      return res.json({ success: false });
    }


    const product = await Product.findById(productId);
    const variant = product?.variants.find(v => v.size === item.size);

    if (variant) {
      variant.quantity += item.quantity;
      await product.save();
    }

 

    const originalSubtotal = order.priceDetails.subtotal;
    const originalDiscount = order.priceDetails.discount;

    const itemSubtotal = item.itemTotal;
    const itemTax = Math.round(itemSubtotal * 0.05);

    let proportionalDiscount = 0;

    if (originalSubtotal > 0 && originalDiscount > 0) {
      proportionalDiscount = Math.round(
        (itemSubtotal / originalSubtotal) * originalDiscount
      );
    }

    const refundAmount =
      itemSubtotal + itemTax - proportionalDiscount;


    item.isCancelled = true;
    item.cancelReason = reason;



    const activeItems = order.items.filter(i => !i.isCancelled);

    const newSubtotal = activeItems.reduce(
      (sum, i) => sum + i.itemTotal,
      0
    );

    const newTax = Math.round(newSubtotal * 0.05);

    let newDiscount = 0;

    if (originalSubtotal > 0 && originalDiscount > 0) {
      newDiscount = Math.round(
        (newSubtotal / originalSubtotal) * originalDiscount
      );
    }

    const newTotal = newSubtotal + newTax - newDiscount;

    order.priceDetails.subtotal = newSubtotal;
    order.priceDetails.tax = newTax;
    order.priceDetails.discount = newDiscount;
    order.priceDetails.total = newTotal < 0 ? 0 : newTotal;

    if (activeItems.length === 0) {
      order.orderStatus = "Cancelled";
    }

    await order.save();

   

    if (
      refundAmount > 0 &&
      order.paymentMethod !== "COD" &&
      order.paymentStatus === "PAID"
    ) {
      await creditWallet(
        req.session.user._id,
        refundAmount,
        `Refund for cancelled item ${item.productName} in order ${order.orderId}`
      );
    }

    res.json({ success: true });

  } catch (error) {
    console.error("Cancel order item error:", error);
    res.status(500).json({ success: false });
  }
};


export const returnOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
      items: { $elemMatch: { isCancelled: false } },
    });

    if (order.orderStatus !== "Delivered") {
      return res.json({ success: false });
    }

    order.returnStatus = "REQUESTED";
    order.returnReason = reason;
    order.items.forEach((item) => {
      if (item.isCancelled === false) {
        item.returnStatus = "REQUESTED";
        item.returnReason = reason;
      }
    });

    await order.save();

    await Order.findByIdAndUpdate(order._id, {
      orderStatus: "Return Requested",
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error in Return order :", error.message);
    res.status(500).json({ success: false }).render("errors/500");
  }
};

export const returnOrderItem = async (req, res) => {
  try {
    const { productId, reason } = req.body;
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
      orderStatus: "Delivered",
    });

    const item = order.items.find((i) => i.productId.toString() === productId);

    if (!item || item.returnStatus !== "NONE" || item.isCancelled) {
      return res.json({ success: false });
    }

    item.returnStatus = "REQUESTED";
    item.returnReason = reason;
    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error in Return order Item :", error.message);
    res.status(500).json({ success: false }).render("errors/500");
  }
};

export const requestItemReturn = async (req, res) => {
  const { productId, reason } = req.body;

  const order = await Order.findOne({
    orderId: req.params.id,
    userId: req.session.user._id,
    orderStatus: "Delivered",
  });

  const item = order.items.find((i) => i.productId.toString() === productId);

  if (!item || item.returnStatus !== "NONE") {
    return res.json({ success: false });
  }

  item.returnStatus = "REQUESTED";
  item.returnReason = reason;

  await order.save();

  await Order.findByIdAndUpdate(order._id, {
    orderStatus: "Return Requested",
  });

  res.json({ success: true });
};

export const downloadInvoice = async (req, res) => {
  try {
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    if (!order) {
      return res.status(404).send("Order not Found");
    }

    const invoiceItems = order.items.filter(
      (item) => !item.isCancelled && item.returnStatus !== "APPROVED",
    );

    const invoiceSubtotal = invoiceItems.reduce(
      (sum, i) => sum + i.itemTotal,
      0,
    );

    const invoiceTax = Math.round(invoiceSubtotal * 0.05);

    const invoiceTotal =
      invoiceSubtotal +
      invoiceTax +
      order.priceDetails.shipping -
      order.priceDetails.discount;

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${order.orderId}.pdf`,
    );

    doc.pipe(res);

    const leftX = 40;
    const rightX = 555;
    const colProduct = 40;
    const colQty = 300;
    const colPrice = 380;
    const colTotal = 480;

    let y = 40;

    doc.font("Helvetica-Bold").fontSize(22).text("FOREVER", leftX, y);
    y += 26;

    doc.font("Helvetica").fontSize(11).text("Official Invoice", leftX, y);
    y += 10;

    doc.moveTo(leftX, y).lineTo(rightX, y).stroke();
    y += 18;

    doc.font("Helvetica-Bold").fontSize(11).text("Shipping Address", leftX, y);
    y += 14;

    doc.font("Helvetica").fontSize(10);
    doc.text(order.address.name, leftX, y);
    y += 12;
    doc.text(`${order.address.houseName}, ${order.address.place}`, leftX, y);
    y += 12;
    doc.text(`${order.address.district}, ${order.address.state}`, leftX, y);
    y += 12;
    doc.text(`Pincode : ${order.address.pincode}`, leftX, y);
    y += 12;
    doc.text(`Phone : ${order.address.phone}`, leftX, y);
    y += 20;

    doc.font("Helvetica-Bold").fontSize(11);
    doc.text("Product", colProduct, y);
    doc.text("Qty", colQty, y, { width: 40, align: "right" });
    doc.text("Price", colPrice, y, { width: 60, align: "right" });
    doc.text("Offer Price", colPrice + 80, y, { width: 60, align: "right" });
    doc.text("Total", colTotal, y, { width: 70, align: "right" });

    y += 10;
    doc.moveTo(leftX, y).lineTo(rightX, y).stroke();
    y += 12;

    doc.font("Helvetica").fontSize(10);

    invoiceItems.forEach((item) => {
      doc.text(item.productName, colProduct, y, { width: 230 });
      doc.text(item.quantity.toString(), colQty, y, {
        width: 40,
        align: "right",
      });
      doc.text(`${item.price}`, colPrice, y, { width: 60, align: "right" });
      doc.text(`${item.offerPrice}`, colPrice + 80, y, {
        width: 60,
        align: "right",
      });
      doc.text(`${item.itemTotal}`, colTotal, y, { width: 70, align: "right" });
      y += 18;
    });

    y += 6;
    doc.moveTo(leftX, y).lineTo(rightX, y).stroke();
    y += 16;

    doc.font("Helvetica-Bold").fontSize(10);

    const labelX = colPrice;
    const valueX = colTotal;

    doc.text("Subtotal", labelX, y, { width: 80, align: "right" });
    doc.text(`${invoiceSubtotal}`, valueX, y, {
      width: 70,
      align: "right",
    });
    y += 14;

    doc.text("Tax", labelX, y, { width: 80, align: "right" });
    doc.text(`${invoiceTax}`, valueX, y, {
      width: 70,
      align: "right",
    });
    y += 14;

    doc.text("Discount", labelX, y, { width: 80, align: "right" });
    doc.text(`${order.priceDetails.discount}`, valueX, y, {
      width: 70,
      align: "right",
    });
    y += 14;

    doc.text("Shipping", labelX, y, { width: 80, align: "right" });
    doc.text(`${order.priceDetails.shipping}`, valueX, y, {
      width: 70,
      align: "right",
    });
    y += 10;

    doc.moveTo(labelX, y).lineTo(rightX, y).stroke();
    y += 14;

    doc.fontSize(12);
    doc.text("Total Amount", labelX, y, { width: 80, align: "right" });
    doc.text(`${invoiceTotal}`, valueX, y, {
      width: 70,
      align: "right",
    });

    y += 80;
    doc
      .font("Helvetica")
      .fontSize(9)
      .text(
        "Thank you for shopping with FOREVER.\nThis is a system generated invoice and does not require a signature.",
        leftX,
        y,
        { align: "center", width: rightX - leftX },
      );

    doc.end();
  } catch (error) {
    console.error("Error in download Invoice:", error.message);
    res.status(500).render("errors/500");
  }
};
