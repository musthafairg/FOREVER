import express from 'express'
const router=express.Router()
import {loadSignup,loadLogin,signupUser,loadOtp,verifyOtp,resendOtp} from '../controllers/user/userController.js'




//signup Management

router.get("/signup",loadSignup);
router.get("/login",loadLogin);
router.post("/signup",signupUser)
router.post("/verify-otp",verifyOtp)
router.post("/resend-otp",resendOtp)
router.get("/otpPage",loadOtp)

export default router;