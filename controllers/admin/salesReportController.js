import Order from "../../models/orderModel.js";
import PDFDocument from "pdfkit";
import ExcelJS from "exceljs";
import { getDateRange } from "../../utils/getDateRange.js";

export const loadSalesReport = async (req, res) => {
  try {
    const { filter = "today", from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: {
        $gte: start,
        $lte: end,
      },
      paymentStatus: "PAID",
      orderStatus: { $in: ["Delivered", "Returned"] },
    });

    let totalOrders = orders.length;
    let totalSales = 0;
    let totalDiscount = 0;
    let totalCouponDiscount = 0;

    orders.forEach((order) => {
      totalSales += order.priceDetails.total;
      totalDiscount += order.priceDetails.discount;
      totalCouponDiscount += order.priceDetails.couponDiscount;
    });
    res.render("admin/sales-report", {
      orders,
      filter,
      from,
      to,
      totalOrders,
      totalSales,
      totalDiscount,
      totalCouponDiscount,
    });
  } catch (error) {
    console.error("Error loading sales report:", error);
    res.status(500).send("Internal Server Error");
  }
};

export const downloadSalesReportPDF = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    });

    const doc = new PDFDocument({ margin: 40 });
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf",
    );

    doc.pipe(res);

    doc.fontSize(18).text("FOREVER - Sales Report", { align: "center" });
    doc.moveDown();

    orders.forEach((o) => {
      doc
        .fontSize(10)
        .text(
          `${o.orderId} | ₹${o.priceDetails.total} | Discount ₹${o.priceDetails.discount || 0} | ${o.createdAt.toDateString()}`,
        );
    });

    doc.end();
  } catch (error) {
    console.error("PDF report error:", error.message);
    res.status(500).send("Server Error");
  }
};

export const downloadSalesReportExcel = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 20 },
      { header: "Date", key: "date", width: 15 },
      { header: "Total", key: "total", width: 15 },
      { header: "Discount", key: "discount", width: 15 },
      { header: "Payment", key: "payment", width: 15 },
    ];

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        date: o.createdAt.toDateString(),
        total: o.priceDetails.total,
        discount: o.priceDetails.discount || 0,
        payment: o.paymentMethod,
      });
    });

    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.xlsx",
    );

    await workbook.xlsx.write(res);
    res.end();
  } catch (error) {
    console.error("Excel report error:", error.message);
    res.status(500).send("Server Error");
  }
};
