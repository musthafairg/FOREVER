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
import { addToCart, loadCart, removeFromCart, updateCartQuantity } from '../controllers/user/cartController.js'
import { loadCheckout } from '../controllers/user/checkoutController.js'
import { loadWishlist, removeFromWishlist, addToWishlist } from '../controllers/user/wishlistController.js'
import { cancelOrder, cancelOrderItem, downloadInvoice, loadOrderDetail, loadOrders, loadSuccess, placeOrder, returnOrder } from '../controllers/user/orderController.js'
const uploads   =   multer({storage})

import { validate } from '../middleware/validate.js'
import { addressSchema } from '../validations/address.validation.js'

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

router.get("/address",userAuth,loadAddressPage)
router.get("/address/add",userAuth,loadAddAddressPage)
router.post("/address/add",userAuth,validate(addressSchema),addAddress)
router.get("/address/edit/:index",userAuth,loadEditAddress)
router.post("/address/edit/:index",userAuth,validate(addressSchema),updateAddress)
router.get("/address/delete/:index",userAuth,deleteAddress)
router.get("/address/default/:index",userAuth,setDefaultAddress)

//Cart Management
router.get("/cart",userAuth,loadCart)
router.post("/cart/add",userAuth,addToCart)
router.post("/cart/update-qty",userAuth,updateCartQuantity)
router.post("/cart/remove",userAuth,removeFromCart)

// Order Management

router.get("/checkout",userAuth,loadCheckout)
router.post("/checkout/place-order",userAuth,placeOrder)
router.get("/orders",userAuth,loadOrders)
router.get("/orders/:id",userAuth,loadOrderDetail)
router.post("/orders/:id/cancel",userAuth,cancelOrder)
router.post("/orders/:id/cancel-item",userAuth,cancelOrderItem)
router.get("/orders/:id/invoice",userAuth,downloadInvoice)
router.post("/orders/:id/return",userAuth,returnOrder)
router.get("/order-success",userAuth,loadSuccess)


// Wishlist Management

router.get("/wishlist",userAuth,loadWishlist)
router.post("/wishlist/add",userAuth,addToWishlist)
router.post("/wishlist/remove",userAuth,removeFromWishlist)


export default router;