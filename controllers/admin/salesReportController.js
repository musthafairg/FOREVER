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
      orderStatus: "Delivered",
    }).sort({ createdAt: -1 });

    let totalOrders = orders.length;
    let totalSales = 0;
    let totalDiscount = 0;

    orders.forEach((o) => {
      totalSales += o.priceDetails?.total || 0;
      totalDiscount += o.priceDetails?.discount || 0;
    });

    res.render("admin/sales-report", {
      orders,
      filter,
      from,
      to,
      totalOrders,
      totalSales,
      totalDiscount,
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
      orderStatus: "Delivered",
    }).sort({ createdAt: 1 });

    const doc = new PDFDocument({ size: "A4", margin: 40 });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", "attachment; filename=sales-report.pdf");

    doc.pipe(res);

    doc.fontSize(22).font("Helvetica-Bold").text("FOREVER", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(12).font("Helvetica").text("Sales Report", { align: "center" });
    doc.moveDown(0.3);
    doc.fontSize(10).text(
      `Period: ${start.toDateString()} to ${end.toDateString()}`,
      { align: "center" }
    );

    doc.moveDown(1);

    const tableTop = doc.y;
    const colX = { order: 40, date: 160, discount: 360, total: 460 };

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Order ID", colX.order, tableTop);
    doc.text("Date", colX.date, tableTop);
    doc.text("Discount", colX.discount, tableTop, { width: 70, align: "right" });
    doc.text("Total", colX.total, tableTop, { width: 70, align: "right" });

    doc.moveDown(0.5);
    doc.moveTo(40, doc.y).lineTo(555, doc.y).stroke();

    let y = doc.y + 5;
    let totalSales = 0;
    let totalDiscount = 0;

    doc.font("Helvetica");

    orders.forEach((o) => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }

      const discount = o.priceDetails?.discount || 0;
      const total = o.priceDetails?.total || 0;

      doc.text(o.orderId, colX.order, y);
      doc.text(o.createdAt.toDateString(), colX.date, y);
      doc.text(`₹${discount}`, colX.discount, y, { width: 70, align: "right" });
      doc.text(`₹${total}`, colX.total, y, { width: 70, align: "right" });

      totalSales += total;
      totalDiscount += discount;
      y += 16;
    });

    doc.moveDown(1);
    doc.font("Helvetica-Bold");
    doc.text(`Total Discount: ₹${totalDiscount}`, 360);
    doc.text(`Total Sales: ₹${totalSales}`, 360);

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
      orderStatus: "Delivered",
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 25 },
      { header: "Date", key: "date", width: 20 },
      { header: "Total (₹)", key: "total", width: 15 },
      { header: "Discount (₹)", key: "discount", width: 15 },
    ];

    sheet.getRow(1).font = { bold: true };

    let total = 0;
    let discount = 0;

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        date: o.createdAt.toDateString(),
        total: o.priceDetails?.total || 0,
        discount: o.priceDetails?.discount || 0,
      });

      total += o.priceDetails?.total || 0;
      discount += o.priceDetails?.discount || 0;
    });

    const totalRow = sheet.addRow({
      orderId: "TOTAL",
      total,
      discount,
    });

    totalRow.font = { bold: true };

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
