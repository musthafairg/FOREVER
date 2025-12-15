import express from 'express'
const router=express.Router()
import {loadLogin,login,loadDashboard,logout} from '../controllers/admin/adminController.js'
import {userInfo,blockCustomer,unblockCustomer} from '../controllers/admin/userController.js'
import {categoryInfo,getAddCategoryPage,addCategory,listCategory,unlistCategory,geteditCategoryPage,editCategory} from '../controllers/admin/categoryController.js'
import { getAddProductPage ,addProducts,productInfo,blockProduct,unblockProduct,getEditProduct,editProduct,deleteSingleImage} from '../controllers/admin/productController.js'
import {adminAuth}from '../middleware/auth.js'
import multer from 'multer'
import { storage } from '../helpers/multer.js'
const uploads   =   multer({storage})

//Login Management
router.get("/login",loadLogin)
router.post("/login",login)
router.get("/logout",logout)

router.get("/",adminAuth,loadDashboard)

//User Management
router.get("/users",adminAuth,userInfo)
router.get("/blockCustomer",adminAuth,blockCustomer)
router.get("/unblockCustomer",adminAuth,unblockCustomer)

//Category Management
router.get("/category",adminAuth,categoryInfo)
router.get("/addCategory",adminAuth,getAddCategoryPage)
router.post("/addCategory",adminAuth,addCategory)
router.get("/listCategory",adminAuth,listCategory)
router.get("/unlistCategory",adminAuth,unlistCategory)
router.get("/editCategory",adminAuth,geteditCategoryPage)
router.post("/editCategory",adminAuth,editCategory)

//Product Management

router.get("/addProducts",adminAuth,getAddProductPage)
router.post("/addProducts",adminAuth,uploads.array("images",4),addProducts)
router.get("/products",adminAuth,productInfo)
router.get("/blockProduct",adminAuth,blockProduct)
router.get("/unblockProduct",adminAuth,unblockProduct)
router.get("/editProduct",adminAuth,getEditProduct)
router.post("/editProduct/:id",adminAuth,uploads.array("images",4),editProduct)
router.post("/deleteImage",adminAuth,deleteSingleImage)


export default router;