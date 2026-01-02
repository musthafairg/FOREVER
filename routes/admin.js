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
const uploads   =   multer({storage})

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
export default router;