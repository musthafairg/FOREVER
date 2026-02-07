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
    });

    let totalOrders = orders.length;
    let totalSales = 0;
    let totalDiscount = 0;

    orders.forEach((o) => {
      totalSales += o.priceDetails.total || 0;
      totalDiscount += o.priceDetails.discount || 0;
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
  } catch (error) {
    console.error("Sales report error:", error.message);
    res.status(500).send("Server Error");
  }
};export const downloadSalesReportPDF = async (req, res) => {
  try {
    const { filter, from, to } = req.query;
    const { start, end } = getDateRange(filter, from, to);

  
    const orders = await Order.find({
      createdAt: { $gte: start, $lte: end },
      paymentStatus: "PAID",
      orderStatus: "Delivered",
    }).sort({ createdAt: 1 });

    const doc = new PDFDocument({ margin: 40, size: "A4" });

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=sales-report.pdf"
    );

    doc.pipe(res);


    let y = doc.y;

    const checkPageBreak = () => {
      if (y > 750) {
        doc.addPage();
        y = 40;
      }
    };

   
    doc.font("Helvetica-Bold").fontSize(22).text("FOREVER", {
      align: "center",
    });

    doc.font("Helvetica").fontSize(12).text("Sales Report", {
      align: "center",
    });

    doc.moveDown(0.5);

    doc.fontSize(10).text(
      `Period: ${start.toDateString()} to ${end.toDateString()}`,
      { align: "center" }
    );

    y = doc.y + 10;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 20;

 
    const col = {
      order: 40,
      date: 160,
      payment: 260,
      discount: 360,
      total: 460,
    };

    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("Order ID", col.order, y);
    doc.text("Date", col.date, y);
    doc.text("Payment", col.payment, y);
    doc.text("Discount", col.discount, y, { width: 70, align: "right" });
    doc.text("Total", col.total, y, { width: 70, align: "right" });

    y += 15;
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 10;

   
    doc.font("Helvetica").fontSize(10);

    let grandTotal = 0;
    let totalDiscount = 0;

    for (const o of orders) {
      checkPageBreak();

      doc.text(o.orderId, col.order, y);
      doc.text(o.createdAt.toDateString(), col.date, y);
      doc.text(o.paymentMethod, col.payment, y);

      const discount = o.priceDetails.discount || 0;
      const total = o.priceDetails.total || 0;

      doc.text(`₹${discount}`, col.discount, y, {
        width: 70,
        align: "right",
      });

      doc.text(`₹${total}`, col.total, y, {
        width: 70,
        align: "right",
      });

      totalDiscount += discount;
      grandTotal += total;

      y += 16;
    }

   
    y += 10;
    checkPageBreak();
    doc.moveTo(40, y).lineTo(555, y).stroke();
    y += 15;

    doc.font("Helvetica-Bold");
    doc.text("Total Discount", col.discount, y, {
      width: 70,
      align: "right",
    });
    doc.text(`₹${totalDiscount}`, col.total, y, {
      width: 70,
      align: "right",
    });

    y += 14;
    doc.text("Total Sales", col.discount, y, {
      width: 70,
      align: "right",
    });
    doc.text(`₹${grandTotal}`, col.total, y, {
      width: 70,
      align: "right",
    });


    y += 40;
    checkPageBreak();

    doc.font("Helvetica").fontSize(9).text(
      "This is a system-generated sales report. No signature required.",
      40,
      y,
      { align: "center", width: 515 }
    );

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
      orderStatus: "Delivered",
    });

    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Sales Report");

    sheet.columns = [
      { header: "Order ID", key: "orderId", width: 22 },
      { header: "Date", key: "date", width: 18 },
      { header: "Total (₹)", key: "total", width: 18 },
      { header: "Discount (₹)", key: "discount", width: 18 },
    ];

    sheet.getRow(1).font = { bold: true };

    let total = 0;
    let discount = 0;

    orders.forEach((o) => {
      sheet.addRow({
        orderId: o.orderId,
        date: o.createdAt.toDateString(),
        total: o.priceDetails.total,
        discount: o.priceDetails.discount || 0,
      });

      total += o.priceDetails.total || 0;
      discount += o.priceDetails.discount || 0;
    });

    const totalRow = sheet.addRow({
      orderId: "TOTAL",
      total,
      discount,
    });

    totalRow.font = { bold: true };

    res.setHeader("Content-Disposition", "attachment; filename=sales-report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    console.error("Excel crash:", err.message);
    res.status(500).send("Server Error");
  }
};
