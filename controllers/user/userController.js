import 'dotenv/config'
import User from '../../models/userModel.js';
import {securePassword,generateOtp,sendVerificationEmail} from '../../services/user/userServices.js'



export const loadOtp= async(req,res)=>{
    try {
        res.render("user/otp-verification");
    } catch (error) {
        console.error("OTP page not loading");
        
    }
}



export const loadSignup= (req,res)=>{
    try {
        return res.render("user/signup");
    } catch (error) {
        console.error("Signup page not Loading ",error.message);
        res.status(500).send("Server Error")
    }
}

export const loadLogin= (req,res)=>{
    try {
        return res.render("user/login");
    } catch (error) {
        console.error("Login page not Loading",error.message);
        res.status(500).send("Server Error")
        
    }
}


export const signupUser= async (req,res)=>{
    try {
        const {name,mobile,email,password,confirmPassword}=req.body;
       
        

        const existingUser= await User.findOne({email});

        if(existingUser){
           return  res.render("user/signup",{error:"User already exists"});
        }

        if(password!==confirmPassword){
           return  res.render("user/signup",{error:"password didn't match"})
        }

        const otp=generateOtp();

        const emailSent=await sendVerificationEmail(email,otp);

        if(!emailSent){
            console.error("OTP sending to email not successfull");
            return res.json("email-error")
            
        }
        req.session.userOtp=otp;
        req.session.otpExpires= Date.now()+60*1000;
        req.session.userData={name,mobile,email,password}
        res.render("user/otp-verification");
        console.log("OTP Sent  : ",otp);
        
        
    } catch (error) {

        console.error("Signup Error :",error.message);
        res.status(500).json({success:false,message:"An error Occure"})    
    }

}


export const verifyOtp= async(req,res)=>{

    try {
        const {otp}=req.body;
        console.log("otp from eq.body ",otp);
        

        if(Date.now() > req.session.otpExpires){
            return res.status(400).json({
                success:false,
                message:"OTP expired. Please resend OTP."
            })
        }

        if(otp===req.session.userOtp){

            const user=req.session.userData;
            const passwordHash=await securePassword(user.password);

            const saveUserData= new User({
                name:user.name,
                email:user.email,
                mobile:user.mobile,
                password:passwordHash,
            });

            await saveUserData.save();
            req.session.user=saveUserData;

            req.session.userOtp= null;
            req.session.otpExpires= null;

            return res.json({success:true, redirectUrl:"/login"})

        }
        return res.status(400).json({
            success:false,
            message:"Invalid OTP. Please try again."
        })





    } catch (error) {

        console.error("Error verifying OTP", error.message);

        res.status(500).json({success:false, message:"An error occured."})
        
    }    

}

export const resendOtp= async(req,res)=>{

}

