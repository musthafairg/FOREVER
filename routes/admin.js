import express from "express";
const router = express.Router();
import {
  loadLogin,
  login,
  logout,
} from "../controllers/admin/adminController.js";
import {
  userInfo,
  blockCustomer,
  unblockCustomer,
} from "../controllers/admin/userController.js";
import {
  categoryInfo,
  getAddCategoryPage,
  addCategory,
  listCategory,
  unlistCategory,
  geteditCategoryPage,
  editCategory,
} from "../controllers/admin/categoryController.js";
import {
  getAddProductPage,
  addProducts,
  productInfo,
  blockProduct,
  unblockProduct,
  getEditProduct,
  editProduct,
  deleteSingleImage,
} from "../controllers/admin/productController.js";
import { adminAuth } from "../middleware/auth.js";
import multer from "multer";
import { storage } from "../helpers/multer.js";
import {
  loadAdminOrderDetail,
  loadAdminOrders,
  updateOrderStatus,
  updateReturnStatus,
  updateReturnItemStatus,
} from "../controllers/admin/orderController.js";
import { validate } from "../middleware/validate.js";
const uploads = multer({ storage });
import {
  loadStockPage,
  updateStock,
} from "../controllers/admin/stockController.js";
import { updateStockSchema } from "../validations/stockSchema.js";
import {
  addCategoryOffer,
  addProductOffer,
  loadCategoryOffers,
  loadProductOffers,
  toggleCategoryOffer,
  toggleProductOffer,
} from "../controllers/admin/offerController.js";
import {
  createCoupon,
  deleteCoupon,
  loadCoupons,
  toggleCoupon,
  getCoupon,
  updateCoupon,
} from "../controllers/admin/couponControoller.js";
import {
  downloadSalesReportExcel,
  downloadSalesReportPDF,
  loadSalesReport,
} from "../controllers/admin/salesReportController.js";
import {
  productOfferSchema,
  categoryOfferSchema,
} from "../validations/offerSchema.js";
import { couponSchema } from "../validations/couponSchema.js";
import { salesReportSchema } from "../validations/salesReportSchema.js";
import {
  loadDashboard,
  getDashboardData,
} from "../controllers/admin/dashboardController.js";

//Login Management
router.get("/login", loadLogin);
router.post("/login", login);
router.get("/logout", logout);

router.get("/", adminAuth, loadDashboard);
router.get("/dashboard/data", adminAuth, getDashboardData);

//User Management
router.get("/users", adminAuth, userInfo);
router.get("/block-customer", adminAuth, blockCustomer);
router.get("/unblock-customer", adminAuth, unblockCustomer);

//Category Management
router.get("/category", adminAuth, categoryInfo);
router.get("/add-category", adminAuth, getAddCategoryPage);
router.post("/add-category", adminAuth, addCategory);
router.get("/list-category", adminAuth, listCategory);
router.get("/unlist-category", adminAuth, unlistCategory);
router.get("/edit-category", adminAuth, geteditCategoryPage);
router.post("/edit-category", adminAuth, editCategory);

//Product Management

router.get("/add-products", adminAuth, getAddProductPage);
router.post(
  "/add-products",
  adminAuth,
  uploads.array("images", 4),
  addProducts,
);
router.get("/products", adminAuth, productInfo);
router.get("/block-product", adminAuth, blockProduct);
router.get("/unblock-product", adminAuth, unblockProduct);
router.get("/edit-product", adminAuth, getEditProduct);
router.post(
  "/edit-product",
  adminAuth,
  uploads.array("images", 4),
  editProduct,
);
router.post("/delete-image", adminAuth, deleteSingleImage);

// Order Management

router.get("/orders", adminAuth, loadAdminOrders);
router.get("/orders/:id", adminAuth, loadAdminOrderDetail);
router.post("/orders/:id/status", adminAuth, updateOrderStatus);
router.post("/orders/:id/return-status", adminAuth, updateReturnStatus);
router.post(
  "/orders/:id/:productId/return-item-status",
  adminAuth,
  updateReturnItemStatus,
);

//Stock Management

router.get("/stock", adminAuth, loadStockPage);
router.patch("/stock/:id", adminAuth, validate(updateStockSchema), updateStock);

//Product Offers

router.get("/offers/product", adminAuth, loadProductOffers);
router.post(
  "/offers/product/add",
  adminAuth,
  validate(productOfferSchema),
  addProductOffer,
);
router.patch("/offers/product/toggle/:id", adminAuth, toggleProductOffer);

// Category Offers

router.get("/offers/category", adminAuth, loadCategoryOffers);
router.post(
  "/offers/category/add",
  adminAuth,
  validate(categoryOfferSchema),
  addCategoryOffer,
);
router.patch("/offers/category/toggle/:id", adminAuth, toggleCategoryOffer);

// Coupon Management

router.get("/coupons", adminAuth, loadCoupons);
router.get("/coupons/:id", adminAuth, getCoupon);
router.post("/coupons/add", adminAuth, validate(couponSchema), createCoupon);
router.put(
  "/coupons/edit/:id",
  adminAuth,
  validate(couponSchema),
  updateCoupon,
);
router.patch("/coupons/toggle/:id", adminAuth, toggleCoupon);
router.delete("/coupons/delete/:id", adminAuth, deleteCoupon);

// Sales Report Management

router.get(
  "/sales-report",
  adminAuth,
  validate(salesReportSchema),
  loadSalesReport,
);
router.get(
  "/sales-report/pdf",
  adminAuth,
  validate(salesReportSchema),
  downloadSalesReportPDF,
);
router.get(
  "/sales-report/excel",
  adminAuth,
  validate(salesReportSchema),
  downloadSalesReportExcel,
);

export default router;
