import express from 'express'
const router=express.Router()
import {loadLogin,login,loadDashboard,logout} from '../controllers/admin/adminController.js'
import {userInfo,blockCustomer,unblockCustomer} from '../controllers/admin/userController.js'
import {categoryInfo,getAddCategoryPage,addCategory,listCategory,unlistCategory,geteditCategoryPage,editCategory} from '../controllers/admin/categoryController.js'
import { getAddProductPage ,addProducts,productInfo,blockProduct,unblockProduct,getEditProduct,editProduct,deleteSingleImage} from '../controllers/admin/productController.js'
import {adminAuth}from '../middleware/auth.js'
import multer from 'multer'
import { storage } from '../helpers/multer.js'
import { loadAdminOrderDetail, loadAdminOrders, updateOrderStatus } from '../controllers/admin/orderController.js'
import { validate } from '../middleware/validate.js'
const uploads   =   multer({storage})
import {loadStockPage,updateStock} from '../controllers/admin/stockController.js'
import {updateStockSchema} from '../validations/stockSchema.js'
import { addCategoryOffer, addProductOffer, loadCategoryOffers, loadProductOffers, toggleCategoryOffer, toggleProductOffer } from '../controllers/admin/offerController.js'
import { createCoupon, deleteCoupon, loadCoupons, toggleCoupon } from '../controllers/admin/couponControoller.js'
//Login Management
router.get("/login",loadLogin)
router.post("/login",login)
router.get("/logout",logout)

router.get("/",adminAuth,loadDashboard)

//User Management
router.get("/users",adminAuth,userInfo)
router.get("/block-customer",adminAuth,blockCustomer)
router.get("/unblock-customer",adminAuth,unblockCustomer)

//Category Management
router.get("/category",adminAuth,categoryInfo)
router.get("/add-category",adminAuth,getAddCategoryPage)
router.post("/add-category",adminAuth,addCategory)
router.get("/list-category",adminAuth,listCategory)
router.get("/unlist-category",adminAuth,unlistCategory)
router.get("/edit-category",adminAuth,geteditCategoryPage)
router.post("/edit-category",adminAuth,editCategory)

//Product Management

router.get("/add-products",adminAuth,getAddProductPage)
router.post("/add-products",adminAuth,uploads.array("images",4),addProducts)
router.get("/products",adminAuth,productInfo)
router.get("/block-product",adminAuth,blockProduct)
router.get("/unblock-product",adminAuth,unblockProduct)
router.get("/edit-product",adminAuth,getEditProduct)
router.post("/edit-product/:id",adminAuth,uploads.array("images",4),editProduct)
router.post("/delete-image",adminAuth,deleteSingleImage)

// Order Management

router.get("/orders",adminAuth,loadAdminOrders)
router.get("/orders/:id",adminAuth,loadAdminOrderDetail)
router.post("/orders/:id/status",adminAuth,updateOrderStatus)

//Stock Management

router.get("/stock",adminAuth,loadStockPage)
router.patch("/stock/:id",adminAuth,validate(updateStockSchema),updateStock)


//Product Offers 

router.get("/offers/product",adminAuth,loadProductOffers)
router.post("/offers/product/add",adminAuth,addProductOffer)
router.get("offers/product/toggle/:id",adminAuth,toggleProductOffer)



// Category Offers

router.get("/offers/category",adminAuth,loadCategoryOffers)
router.post("/offers/category/add",adminAuth,addCategoryOffer)
router.get("offers/category/toggle/:id",adminAuth,toggleCategoryOffer)


// Coupon Management

router.get("/coupons",adminAuth,loadCoupons)
router.post("/coupons/add",adminAuth,createCoupon)
router.get("/coupons/toggle/:id",adminAuth,toggleCoupon)
router.get("/coupons/delete/:id",adminAuth,deleteCoupon)








export default router;