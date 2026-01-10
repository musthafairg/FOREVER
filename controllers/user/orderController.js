import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import PDFDocument from "pdfkit";
import razorpay from "../../config/razorpay.js";
import crypto from "crypto";

const generateOrderId = async () => {
  const count = await Order.countDocuments();

  return `FR-${new Date().getDate()}-${String(count + 1).padStart(6, "0")}`;
};

export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId, paymentMethod } = req.body;

    const cart = await Cart.findOne({ userId }).populate("items.productId");
    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart empty" });
    }

    const addressData = await Address.findOne({ userId });
    const selectedAddress = addressData.address.find(
      (a) => a._id.toString() === addressId
    );

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      productName: i.productId.productName,
      productImage: i.productId.productImage[0],
      price: i.productId.salePrice,
      quantity: i.quantity,
      itemTotal: i.productId.salePrice * i.quantity,
    }));

    const subtotal = items.reduce((a, b) => a + b.itemTotal, 0);
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax;

    const order = new Order({
      orderId: await generateOrderId(),
      userId,
      items,
      address: selectedAddress,
      priceDetails: { subtotal, tax, shipping: 0, discount: 0, total },
      paymentMethod,
      paymentStatus: paymentMethod === "COD" ? "PAID" : "PENDING",
    });

    await order.save();

    // reduce stock
    for (const i of cart.items) {
      await Product.findByIdAndUpdate(i.productId._id, {
        $inc: { quantity: -i.quantity },
      });
    }

    await Cart.deleteOne({ userId });

    // ✅ COD FLOW
    if (paymentMethod === "COD") {
      return res.json({ success: true, redirect: "/order-success" });
    }

    // ✅ ONLINE FLOW (Razorpay)
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
  } catch (err) {
    console.error(err);
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
      });
      return res.json({ success: false });
    }

    await Order.findByIdAndUpdate(orderId, {
      paymentStatus: "PAID",
      razorpayPaymentId: razorpay_payment_id,
      razorpaySignature: razorpay_signature,
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
    res.status(500).send("Server Error");
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
    res.status(500).send("Server Error");
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

    res.render("user/order-details", {
      user,
      order,
    });
  } catch (error) {
    console.error("Error in load order Details :", error.message);
    res.status(500).send("Server Error");
  }
};

export const cancelOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    if (order.orderStatus === "Delivered") {
      return res.json({ success: false });
    }

    for (const i of order.items) {
      await Product.findByIdAndUpdate(i.productId, {
        $inc: { quantity: i.quantity },
      });
    }

    order.orderStatus = "Cancelled";
    order.cancelReason = reason;

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error in Cancel order :", error.message);
    res.status(500).send("Server Error");
  }
};

export const cancelOrderItem = async (req, res) => {
  try {
    const { productId, reason } = req.body;
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    const item = order.items.find((i) => i.productId.toString() === productId);

    if (!item || item.isCancelled) return res.json({ success: false });

    await Product.findByIdAndUpdate(productId, {
      $inc: { quantity: item.quantity },
    });

    item.isCancelled = true;
    item.cancelReason = reason;

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error in cancel orderItem :", error.message);
    res.status(500).send("Server Error");
  }
};

export const returnOrder = async (req, res) => {
  try {
    const { reason } = req.body;
    const order = await Order.findOne({
      orderId: req.params.id,
      userId: req.session.user._id,
    });

    if (order.orderStatus !== "Delivered") {
      return res.json({ success: false });
    }

    order.orderStatus = "Returned";
    order.orderReason = reason;

    await order.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Error in Return order :", error.message);
    res.status(500).send("Server Error");
  }
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

    const doc = new PDFDocument({ margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${order.orderId}.pdf`
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
doc.text(order.address.name, leftX, y); y += 12;
doc.text(`${order.address.houseName}, ${order.address.place}`, leftX, y); y += 12;
doc.text(`${order.address.district}, ${order.address.state}`, leftX, y); y += 12;
doc.text(`Pincode : ${order.address.pincode}`, leftX, y); y += 12;
doc.text(`Phone : ${order.address.phone}`, leftX, y); y += 20;


doc.font("Helvetica-Bold").fontSize(11);
doc.text("Product", colProduct, y);
doc.text("Qty", colQty, y, { width: 40, align: "right" });
doc.text("Price", colPrice, y, { width: 60, align: "right" });
doc.text("Total", colTotal, y, { width: 70, align: "right" });

y += 10;
doc.moveTo(leftX, y).lineTo(rightX, y).stroke();
y += 12;


doc.font("Helvetica").fontSize(10);

order.items.forEach(item => {
  doc.text(item.productName, colProduct, y, { width: 230 });
  doc.text(item.quantity.toString(), colQty, y, { width: 40, align: "right" });
  doc.text(`${item.price}`, colPrice, y, { width: 60, align: "right" });
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
doc.text(`${order.priceDetails.subtotal}`, valueX, y, { width: 70, align: "right" });
y += 14;

doc.text("Tax", labelX, y, { width: 80, align: "right" });
doc.text(`${order.priceDetails.tax}`, valueX, y, { width: 70, align: "right" });
y += 14;

doc.text("Shipping", labelX, y, { width: 80, align: "right" });
doc.text(`${order.priceDetails.shipping}`, valueX, y, { width: 70, align: "right" });
y += 10;

doc.moveTo(labelX, y).lineTo(rightX, y).stroke();
y += 14;

doc.fontSize(12);
doc.text("Total Amount", labelX, y, { width: 80, align: "right" });
doc.text(`${order.priceDetails.total}`, valueX, y, { width: 70, align: "right" });


y += 40;
doc.font("Helvetica").fontSize(9).text(
  "Thank you for shopping with FOREVER.\nThis is a system generated invoice and does not require a signature.",
  leftX,
  y,
  { align: "center", width: rightX - leftX }
);

doc.end();

  } catch (error) {
    console.error("Error in download Invoice:", error.message);
    res.status(500).send("Server Error");
  }
};
