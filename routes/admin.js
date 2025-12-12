import express from 'express'
const router=express.Router()
import {loadLogin,login,loadDashboard,logout} from '../controllers/admin/adminController.js'
import {userInfo,blockCustomer,unblockCustomer} from '../controllers/admin/userController.js'
import {categoryInfo,getAddCategoryPage,addCategory,listCategory,unlistCategory,geteditCategoryPage,editCategory} from '../controllers/admin/categoryController.js'
import { getAddProductPage ,addProducts,productInfo,blockProduct,unblockProduct,getEditProduct,editProduct,deleteSingleImage} from '../controllers/admin/productController.js'

import multer from 'multer'
import { storage } from '../helpers/multer.js'
const uploads   =   multer({storage})

//Login Management
router.get("/login",loadLogin)
router.post("/login",login)
router.get("/logout",logout)

router.get("/",loadDashboard)

//User Management
router.get("/users",userInfo)
router.get("/blockCustomer",blockCustomer)
router.get("/unblockCustomer",unblockCustomer)

//Category Management
router.get("/category",categoryInfo)
router.get("/addCategory",getAddCategoryPage)
router.post("/addCategory",addCategory)
router.get("/listCategory",listCategory)
router.get("/unlistCategory",unlistCategory)
router.get("/editCategory",geteditCategoryPage)
router.post("/editCategory",editCategory)

//Product Management

router.get("/addProducts",getAddProductPage)
router.post("/addProducts",uploads.array("images",4),addProducts)
router.get("/products",productInfo)
router.get("/blockProduct",blockProduct)
router.get("/unblockProduct",unblockProduct)
router.get("/editProduct",getEditProduct)
router.post("/editProduct/:id",uploads.array("images",4),editProduct)
router.post("/deleteImage",deleteSingleImage)









export default router;