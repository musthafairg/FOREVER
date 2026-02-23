import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { getDateRange } from "../../utils/getDateRange.js";

export const loadSalesReport = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    }).sort({ createdAt: -1 });

    let totalOrders = orders.length;
    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;

    let cancelledAmount = 0;
    let refundedAmount = 0;
    let netRevenue = 0;
    let totalItemsSold = 0;
    let totalReturnedItems = 0;

    let paymentSummary = {
      COD: 0,
      ONLINE: 0,
      WALLET: 0,
    };

    let productSales = {};

    orders.forEach((order) => {
      grossRevenue += order.priceDetails?.subtotal || 0;
      totalDiscount += order.priceDetails?.discount || 0;
      totalTax += order.priceDetails?.tax || 0;

      order.items.forEach((item) => {
        const itemValue = item.itemTotal || 0;

        // Cancelled
        if (item.isCancelled) {
          cancelledAmount += itemValue;
          return;
        }

        // Refunded / Returned
        if (item.refunded || item.returnStatus === "APPROVED") {
          refundedAmount += itemValue;
          totalReturnedItems += item.quantity;
          return;
        }

        // Valid Sold Item
        totalItemsSold += item.quantity;
        netRevenue += itemValue;

        paymentSummary[order.paymentMethod] += itemValue;

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
      paymentSummary,
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
    }).sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );

    doc.pipe(res);

    doc.fontSize(22).font("Helvetica-Bold").text("FOREVER", {
      align: "center",
    });

    doc.moveDown(0.3);

    doc.fontSize(14).font("Helvetica").text("Sales Report", {
      align: "center",
    });

    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Period: ${start.toDateString()} to ${end.toDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    let cancelledAmount = 0;
    let refundedAmount = 0;
    let netRevenue = 0;
    let totalItemsSold = 0;

    orders.forEach((o) => {
      o.items.forEach((item) => {
        const value = item.itemTotal || 0;

        if (item.isCancelled) {
          cancelledAmount += value;
        } else if (item.refunded || item.returnStatus === "APPROVED") {
          refundedAmount += value;
        } else {
          netRevenue += value;
          totalItemsSold += item.quantity;
        }
      });
    });

    const avgOrderValue =
      orders.length > 0 ? Math.round(netRevenue / orders.length) : 0;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Cancelled Amount: ₹ ${cancelledAmount}`);
    doc.text(`Refunded Amount: ₹ ${refundedAmount}`);
    doc.text(`Net Revenue: ₹ ${netRevenue}`);
    doc.text(`Total Items Sold: ${totalItemsSold}`);
    doc.text(`Average Order Value: ₹ ${avgOrderValue}`);

    doc.moveDown(1);

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Order ID", 40);
    doc.text("Date", 140);
    doc.text("Total", 300);

    doc.moveDown(0.5);
    doc.font("Helvetica").fontSize(9);

    orders.forEach((o) => {
      doc.text(o.orderId, 40);
      doc.text(o.createdAt.toDateString(), 140);
      doc.text(`₹ ${o.priceDetails?.total || 0}`, 300);
      doc.moveDown(0.5);
    });

    doc.end();
  } catch (err) {
    console.error("PDF error:", err.message);
    res.status(500).render("admin/errors/500", {
      page: "sales-report",
    });
  }
};
export const downloadSalesReportExcel = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    }).sort({ createdAt: -1 });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "Total", key: "total", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    let cancelledAmount = 0;
    let refundedAmount = 0;
    let netRevenue = 0;

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        date: o.createdAt.toDateString(),
        total: o.priceDetails?.total || 0,
      });

      o.items.forEach((item) => {
        const value = item.itemTotal || 0;

        if (item.isCancelled) {
          cancelledAmount += value;
        } else if (item.refunded || item.returnStatus === "APPROVED") {
          refundedAmount += value;
        } else {
          netRevenue += value;
        }
      });
    });

    sheet.addRow({});
    sheet.addRow({ orderId: "Cancelled Amount", total: cancelledAmount });
    sheet.addRow({ orderId: "Refunded Amount", total: refundedAmount });
    sheet.addRow({ orderId: "Net Revenue", total: netRevenue });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx"
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel error:", err.message);
    res.status(500).render("admin/errors/500", {
      page: "sales-report",
    });
  }
};