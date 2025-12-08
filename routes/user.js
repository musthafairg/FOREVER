import express from 'express'
const router=express.Router()
import {loadSignup,loadLogin,signupUser,loadOtp,verifyOtp,resendOtp} from '../controllers/user/userController.js'
import passport from '../config/passport.js'




//signup Management

router.get("/signup",loadSignup);
router.get("/login",loadLogin);
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


export default router;