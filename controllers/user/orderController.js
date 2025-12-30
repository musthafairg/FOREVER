import Cart from "../../models/cartModel.js";
import Address from "../../models/addressModel.js";
import Order from "../../models/orderModel.js";
import Product from "../../models/productModel.js";
import User from "../../models/userModel.js";
import PDFDocument from "pdfkit";

const generateOrderId = async () => {
  const count = await Order.countDocuments();

  return `FR-${new Date().getDate()}-${String(count + 1).padStart(6, "0")}`;
};

export const placeOrder = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { addressId } = req.body;

    const user = await User.findById(userId);
    const cart = await Cart.findOne({ userId }).populate("items.productId");

   

    const addressData = await Address.findOne({ userId })

    if (!addressData) {
      return res.json({ success: false, message: "No address found" })
    }


    const selectedAddress = addressData.address.find(
        addr=>addr._id.toString()===addressId
    )

     if (!selectedAddress) {
      return res.json({ success: false, message: "Invalid address" })
    }

    const items = cart.items.map((i) => ({
      productId: i.productId._id,
      productName: i.productId.productName,
      productImage: i.productId.productImage[0],
      price: i.productId.salePrice,
      quantity: i.quantity,
      itemTotal: i.productId.salePrice * i.quantity,
      
    }));

    let subtotal = items.reduce((a, b) => a + b.itemTotal, 0);
    const shipping = 0;
    const discount = 0;
    const tax = Math.round(subtotal * 0.05);
    const total = subtotal + tax + shipping - discount;

    const order = new Order({
      orderId: await generateOrderId(),
      userId,
      address: selectedAddress,
      items,
      priceDetails: {
        subtotal,
        discount,
        tax,
        shipping,
        total,
      },
      
    });

    for (const i of cart.items) {
      await Product.findByIdAndUpdate(i.productId._id, {
        $inc: { quantity: -i.quantity },
      });
    }

    await order.save();
    await Cart.deleteOne({ userId });

    res.json({
      success: true,
      orderId: order.orderId,
    });
  } catch (error) {
    console.error("Place order Error :", error.message);
    res.status(500).json({ success: false });
  }
};

export const loadSuccess= async(req,res)=>{
    try {

        const userId=req.session.user._id
        const user= await User.findById(userId)

        res.render("user/order-success",{user})
    } catch (error) {
        console.error("Error in load order success page: ",error.message)
        res.status(500).send("Server Error")
        
    }
}

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

    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=${order.orderId}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(18).text("FOREVER - Invoice");
    doc.text(`Order ID : ${order.orderId}`);
    doc.text(`Total : ₹${order.priceDetails.total}`);
    doc.end();
  } catch (error) {
    console.error("Error in download Invoice:", error.message);
    res.status(500).send("Server Error");
  }
};
