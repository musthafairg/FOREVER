import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { getDateRange } from "../../utils/getDateRange.js";
import path from "path";
import { fileURLToPath } from "url";

export const loadSalesReport = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    let totalOrders = orders.length;
    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    let cancelledAmount = 0;
    let refundedAmount = 0;
    let netRevenue = 0;

    let totalItemsSold = 0;
    let totalReturnedItems = 0;

    let deliveredOrders = 0;
    let cancelledOrders = 0;
    let returnedOrders = 0;

    let codRevenue = 0;
    let onlineRevenue = 0;
    let walletRevenue = 0;

    let productSales = {};

    orders.forEach((order) => {
      grossRevenue += order.priceDetails?.subtotal || 0;
      totalDiscount += order.priceDetails?.discount || 0;
      totalTax += order.priceDetails?.tax || 0;

      if (order.orderStatus === "Delivered") deliveredOrders++;
      if (order.orderStatus === "Cancelled") cancelledOrders++;
      if (order.orderStatus === "Returned") returnedOrders++;

      order.items.forEach((item) => {
        const itemValue = item.itemTotal || 0;

        if (item.isCancelled) {
          cancelledAmount += itemValue;
          return;
        }

        if (item.refunded || item.returnStatus === "APPROVED") {
          refundedAmount += itemValue;
          totalReturnedItems += item.quantity;
          return;
        }

        totalItemsSold += item.quantity;
        netRevenue += itemValue;

        if (order.paymentMethod === "COD") codRevenue += itemValue;
        if (order.paymentMethod === "ONLINE") onlineRevenue += itemValue;
        if (order.paymentMethod === "WALLET") walletRevenue += itemValue;

        if (!productSales[item.productName]) {
          productSales[item.productName] = 0;
        }

        productSales[item.productName] += item.quantity;
      });
    });

    const averageOrderValue =
      totalOrders > 0 ? Math.round(netRevenue / totalOrders) : 0;

    const topProduct =
      Object.entries(productSales).sort((a, b) => b[1] - a[1])[0] || null;

    res.render("admin/sales-report", {
      page: "sales-report",
      orders,
      filter,
      from,
      to,
      totalOrders,
      grossRevenue,
      totalDiscount,
      totalTax,
      cancelledAmount,
      refundedAmount,
      netRevenue,
      averageOrderValue,
      totalItemsSold,
      totalReturnedItems,
      deliveredOrders,
      cancelledOrders,
      returnedOrders,
      codRevenue,
      onlineRevenue,
      walletRevenue,
      topProduct,
    });
  } catch (err) {
    console.error("Sales report error:", err.message);
    res.status(500).render("admin/errors/500", {
      page: "sales-report",
    });
  }
};
export const downloadSalesReportPDF = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    })
      .populate("userId", "name")
      .sort({ createdAt: -1 });

    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    const fontPath = path.join(
      __dirname,
      "../../public/fonts/NotoSans-Regular.ttf",
    );

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    doc.registerFont("NotoSans", fontPath);
    doc.font("NotoSans");

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf",
    );

    doc.pipe(res);

    doc.fontSize(20).text("Sales Report", { align: "center" });

    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Period: ${start.toDateString()} - ${end.toDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let netRevenue = 0;
    let totalItemsSold = 0;

    orders.forEach((order) => {
      grossRevenue += order.priceDetails?.subtotal || 0;
      totalDiscount += order.priceDetails?.discount || 0;
      totalTax += order.priceDetails?.tax || 0;

      order.items.forEach((item) => {
        if (!item.isCancelled && !item.refunded) {
          netRevenue += item.itemTotal || 0;
          totalItemsSold += item.quantity;
        }
      });
    });

    const avgOrderValue =
      orders.length > 0 ? Math.round(netRevenue / orders.length) : 0;

    doc.fontSize(12).text("Summary");

    doc.moveDown(0.5);

    doc.fontSize(10);

    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Gross Revenue: ₹ ${grossRevenue}`);
    doc.text(`Total Discount: ₹ ${totalDiscount}`);
    doc.text(`Total Tax: ₹ ${totalTax}`);
    doc.text(`Net Revenue: ₹ ${netRevenue}`);
    doc.text(`Items Sold: ${totalItemsSold}`);
    doc.text(`Average Order Value: ₹ ${avgOrderValue}`);

    doc.moveDown(1);

    const tableTop = doc.y;

    const column = {
      orderId: 40,
      customer: 130,
      date: 270,
      items: 370,
      total: 420,
      payment: 480,
      status: 535,
    };

    doc.fontSize(11);

    doc.text("Order ID", column.orderId, tableTop);
    doc.text("Customer", column.customer, tableTop);
    doc.text("Date", column.date, tableTop);
    doc.text("Items", column.items, tableTop);
    doc.text("Total", column.total, tableTop);
    doc.text("Payment", column.payment, tableTop);
    doc.text("Status", column.status, tableTop);

    doc.moveDown(0.5);

    let y = doc.y;

    orders.forEach((o) => {
      const customerName = (o.userId?.name || "User").substring(0, 20);

      doc.fontSize(9);

      doc.text(o.orderId, column.orderId, y, {
        width: 90,
        lineBreak: false,
      });

      doc.text(customerName, column.customer, y, {
        width: 130,
        lineBreak: false,
      });

      doc.text(o.createdAt.toDateString(), column.date, y, {
        width: 100,
        lineBreak: false,
      });

      doc.text(o.items.length.toString(), column.items, y, {
        width: 20,
        align: "center",
        lineBreak: false,
      });

      doc.text(`₹ ${o.priceDetails?.total || 0}`, column.total, y, {
        width: 40,
        align: "center",
        lineBreak: false,
      });

      doc.text(o.paymentMethod, column.payment, y, {
        width: 60,
        lineBreak: false,
      });

      doc.text(o.orderStatus, column.status, y, {
        width: 70,
        lineBreak: false,
      });

      y += 18;

      if (y > 750) {
        doc.addPage();
        y = 50;
      }
    });

    doc.end();
  } catch (err) {
    console.error("PDF export error:", err.message);
    res.status(500).send("PDF generation failed");
  }
};

export const downloadSalesReportExcel = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    }).populate("userId", "name");

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "Customer", key: "customer", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "Items", key: "items", width: 10 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Tax", key: "tax", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Payment", key: "payment", width: 15 },
      { header: "Status", key: "status", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        customer: o.userId?.name || "User",
        date: o.createdAt.toDateString(),
        items: o.items.length,
        subtotal: o.priceDetails?.subtotal || 0,
        discount: o.priceDetails?.discount || 0,
        tax: o.priceDetails?.tax || 0,
        total: o.priceDetails?.total || 0,
        payment: o.paymentMethod,
        status: o.orderStatus,
      });
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel export error:", err.message);
    res.status(500).send("Excel generation failed");
  }
};
