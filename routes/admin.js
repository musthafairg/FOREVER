import express from 'express'
const router=express.Router()
import {loadLogin,login,loadDashboard,logout} from '../controllers/admin/adminController.js'
import {userInfo,blockCustomer,unblockCustomer} from '../controllers/admin/userController.js'
import {categoryInfo,getAddCategoryPage,addCategory,listCategory,unlistCategory,geteditCategoryPage,editCategory} from '../controllers/admin/categoryController.js'



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












export default router;