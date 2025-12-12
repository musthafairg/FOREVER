import express from 'express'
const router=express.Router()
import {loadSignup,loadLogin,signupUser,loadOtp,verifyOtp,resendOtp,login,loadHomepage, loadShoppingPage} from '../controllers/user/userController.js'
import {getProductDetailsPage,filter,filterByPrice} from '../controllers/user/productController.js'
import passport from '../config/passport.js'




//signup Management

router.get("/signup",loadSignup);
router.get("/login",loadLogin);
router.post("/login",login)
router.post("/signup",signupUser)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.get("/otpPage",loadOtp)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),
(req,res)=>{
    req.session.user=req.user;
    res.send("Google auth success")
})




router.get("/",loadHomepage)
router.get("/shop",loadShoppingPage)

// Product Management
router.get("/productDetails",getProductDetailsPage)
router.get("/filterByPrice",filterByPrice)
router.get("/filter",filter)





export default router;