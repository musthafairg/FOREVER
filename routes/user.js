import express from 'express'
const router=express.Router()
import {loadSignup,loadLogin,signupUser,loadOtp,verifyOtp,resendOtp,login,loadHomepage, loadShoppingPage,logout,getForgotPassEmailPage,emailValid, verifyOTPForgotPass,getResetPassPage,resetPassword, demoLogin} from '../controllers/user/userController.js'
import {getProductDetailsPage,filter,filterByPrice,addReview} from '../controllers/user/productController.js'
import {loadUserProfile,loadEditProfilePage, loadEditPasswordPage, updateProfile, changePassword, loadChangeEmailPage,getotp, updateEmail, verifyOtpEmail} from '../controllers/user/profileController.js'
import passport from '../config/passport.js'
import {userAuth} from '../middleware/auth.js'
import {profileUpload} from '../middleware/profileUpload.js'
import multer from 'multer'
import { storage } from '../helpers/multer.js'
import { loadAddressPage,loadAddAddressPage, addAddress, loadEditAddress, updateAddress, deleteAddress, setDefaultAddress } from '../controllers/user/addressController.js'
const uploads   =   multer({storage})



//Login Management

router.get("/login",loadLogin);
router.post("/login",login)
router.get("/logout",logout)
router.get("/demo-login",demoLogin)


//signup Management

router.get("/signup",loadSignup);
router.post("/signup",signupUser)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.get("/otp-page",loadOtp)

router.get("/forgot-password",getForgotPassEmailPage)
router.post("/forgot-email-valid",emailValid)
router.post("/verify-otp-forgot",verifyOTPForgotPass)
router.get("/reset-password",getResetPassPage)
router.post("/reset-password",resetPassword)
router.get('/auth/google',passport.authenticate('google',{scope:['profile','email']}))
router.get('/auth/google/callback',passport.authenticate('google',{failureRedirect:'/signup'}),
(req,res)=>{

    try {
        req.session.user=req.user;
        res.redirect("/")
    } catch (error) {
        console.error("Google login error :",error.message)
        res.redirect("/signup")
        
    }
    
})



router.get("/",loadHomepage)
router.get("/shop",userAuth,loadShoppingPage)

// Product Management
router.get("/product-details",userAuth,getProductDetailsPage)
router.get("/filter-by-Price",userAuth,filterByPrice)
router.get("/filter",userAuth,filter)
router.post("/product/add-review",userAuth,addReview)

//Profile Management
router.get("/user-profile",userAuth,loadUserProfile)
router.get("/change-password",loadEditPasswordPage)
router.post("/change-password",changePassword)
router.get("/edit-profile",loadEditProfilePage)
router.post("/edit-profile",profileUpload.single("profileImage"),updateProfile)
router.get("/change-email",loadChangeEmailPage)
router.post("/change-email",updateEmail)
router.get("/otp-page-user-profile",getotp)
router.post("/verify-otp-email",verifyOtpEmail)


//Address Management

router.get("/address",loadAddressPage)
router.get("/address/add",loadAddAddressPage)
router.post("/address/add",addAddress)
router.get("/address/edit/:index",loadEditAddress)
router.post("/address/edit/:index",updateAddress)
router.get("/address/delete/:index",deleteAddress)
router.get("/address/default/:index",setDefaultAddress)


export default router;