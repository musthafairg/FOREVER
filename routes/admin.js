import express from 'express'
const router=express.Router()
import {loadLogin,login,loadDashboard,logout} from '../controllers/admin/adminController.js'
import {userInfo,blockCustomer,unblockCustomer} from '../controllers/admin/userController.js'



//Login Management
router.get("/login",loadLogin)
router.post("/login",login)
router.get("/logout",logout)

router.get("/",loadDashboard)



//User Management
router.get("/users",userInfo)
router.get("/blockCustomer",blockCustomer)
router.get("/unblockCustomer",unblockCustomer)











export default router;