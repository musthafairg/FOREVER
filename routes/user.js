import express from 'express'
const router=express.Router()
import {loadSignup,loadLogin,signupUser,loadOtp,verifyOtp,resendOtp,login,loadHomepage, loadShoppingPage,logout,getForgotPassEmailPage,emailValid, verifyOTPForgotPass,getResetPassPage,resetPassword, demoLogin} from '../controllers/user/userController.js'
import {getProductDetailsPage,filter,filterByPrice,addReview} from '../controllers/user/productController.js'
import passport from '../config/passport.js'
import {userAuth} from '../middleware/auth.js'

//Login Management

router.get("/login",loadLogin);
router.post("/login",login)
router.get("/logout",logout)
router.get("/demoLogin",demoLogin)


//signup Management

router.get("/signup",loadSignup);
router.post("/signup",signupUser)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.get("/otpPage",loadOtp)
router.get("/forgot-password",getForgotPassEmailPage)
router.post("/forgot-email-valid",emailValid)
router.post("/verify-otp-forgot",verifyOTPForgotPass)
router.get("/reset-password",getResetPassPage)
router.post("/reset-password",resetPassword)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),
(req,res)=>{
    req.session.user=req.user;
    res.send("Google auth success")
})




router.get("/",loadHomepage)
router.get("/shop",userAuth,loadShoppingPage)

// Product Management
router.get("/productDetails",userAuth,getProductDetailsPage)
router.get("/filterByPrice",userAuth,filterByPrice)
router.get("/filter",userAuth,filter)
router.post("/product/add-review",addReview)




export default router;