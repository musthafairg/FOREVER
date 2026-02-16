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
      orderStatus: { $in: ["Delivered", "Returned"] },
    }).sort({ createdAt: -1 });

    let totalOrders = orders.length;
    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let netRevenue = 0;
    let totalItemsSold = 0;

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
      netRevenue += order.priceDetails?.total || 0;

      paymentSummary[order.paymentMethod] += order.priceDetails?.total || 0;

      order.items.forEach((item) => {
        if (!item.isCancelled) {
          totalItemsSold += item.quantity;

          if (!productSales[item.productName]) {
            productSales[item.productName] = 0;
          }

          productSales[item.productName] += item.quantity;
        }
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
      netRevenue,
      averageOrderValue,
      totalItemsSold,
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
      orderStatus: { $in: ["Delivered", "Returned"] },
    }).sort({ createdAt: 1 });

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf",
    );

    doc.pipe(res);

    doc
      .fontSize(22)
      .font("Helvetica-Bold")
      .text("FOREVER", { align: "center" });

    doc.moveDown(0.3);

    doc
      .fontSize(14)
      .font("Helvetica")
      .text("Sales Report", { align: "center" });

    doc.moveDown(0.3);

    doc
      .fontSize(10)
      .text(`Period: ${start.toDateString()} to ${end.toDateString()}`, {
        align: "center",
      });

    doc.moveDown(1);

    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let totalItemsSold = 0;

    orders.forEach((o) => {
      grossRevenue += o.priceDetails.subtotal || 0;
      totalDiscount += o.priceDetails.discount || 0;
      totalTax += o.priceDetails.tax || 0;

      o.items.forEach((item) => {
        if (!item.isCancelled && !item.refunded) {
          totalItemsSold += item.quantity;
        }
      });
    });

    const netRevenue = grossRevenue + totalTax - totalDiscount;
    const avgOrderValue =
      orders.length > 0 ? Math.round(netRevenue / orders.length) : 0;

    doc.fontSize(11).font("Helvetica-Bold");
    doc.text(`Total Orders: ${orders.length}`);
    doc.text(`Gross Revenue: ₹ ${grossRevenue}`);
    doc.text(`Total Discount: ₹ ${totalDiscount}`);
    doc.text(`Total Tax: ₹ ${totalTax}`);
    doc.text(`Net Revenue: ₹ ${netRevenue}`);
    doc.text(`Total Items Sold: ${totalItemsSold}`);
    doc.text(`Average Order Value: ₹ ${avgOrderValue}`);

    doc.moveDown(1);

    const tableTop = doc.y;
    const col = {
      orderId: 40,
      date: 140,
      subtotal: 250,
      discount: 330,
      tax: 400,
      total: 470,
    };

    doc.font("Helvetica-Bold").fontSize(10);

    doc.text("Order ID", col.orderId, tableTop);
    doc.text("Date", col.date, tableTop);
    doc.text("Subtotal", col.subtotal, tableTop);
    doc.text("Discount", col.discount, tableTop);
    doc.text("Tax", col.tax, tableTop);
    doc.text("Total", col.total, tableTop);

    doc
      .moveTo(40, tableTop + 15)
      .lineTo(555, tableTop + 15)
      .stroke();

    let y = tableTop + 25;

    doc.font("Helvetica").fontSize(9);

    orders.forEach((o) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }

      doc.text(o.orderId, col.orderId, y);
      doc.text(o.createdAt.toDateString(), col.date, y);
      doc.text(`₹${o.priceDetails.subtotal}`, col.subtotal, y);
      doc.text(`₹${o.priceDetails.discount}`, col.discount, y);
      doc.text(`₹${o.priceDetails.tax}`, col.tax, y);
      doc.text(`₹${o.priceDetails.total}`, col.total, y);

      y += 18;
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
      orderStatus: { $in: ["Delivered", "Returned"] },
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "Subtotal", key: "subtotal", width: 15 },
      { header: "Tax", key: "tax", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Payment Method", key: "paymentMethod", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    let grossRevenue = 0;
    let totalDiscount = 0;
    let totalTax = 0;
    let netRevenue = 0;

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        date: o.createdAt.toDateString(),
        subtotal: o.priceDetails?.subtotal || 0,
        tax: o.priceDetails?.tax || 0,
        discount: o.priceDetails?.discount || 0,
        total: o.priceDetails?.total || 0,
        paymentMethod: o.paymentMethod,
      });

      grossRevenue += o.priceDetails?.subtotal || 0;
      totalDiscount += o.priceDetails?.discount || 0;
      totalTax += o.priceDetails?.tax || 0;
      netRevenue += o.priceDetails?.total || 0;
    });

    const summaryRow = sheet.addRow({
      orderId: "TOTAL",
      subtotal: grossRevenue,
      tax: totalTax,
      discount: totalDiscount,
      total: netRevenue,
    });

    summaryRow.font = { bold: true };

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx",
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
