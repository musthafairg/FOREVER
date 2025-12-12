import 'dotenv/config'
import User from '../../models/userModel.js';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';
import {securePassword,generateOtp,sendVerificationEmail} from '../../services/user/userServices.js'
import bcrypt from 'bcrypt'



export const loadOtp= async(req,res)=>{
    try {
        res.render("user/otp-verification");
    } catch (error) {
        console.error("OTP page not loading");
        
    }
}


export const loadHomepage= async(req,res)=>{

    try {

        const products= await Product.find({isBlocked:false}).sort({createdAt:-1})




        return res.render("user/home",{
            products
        })
        
    } catch (error) {
        console.error("Home page not loading :",error.message);
        res.status(500).send("Server Error")
        
    }
}

export const loadShoppingPage= async(req,res)=>{

    try {

        let page=1
        if(req.query.page){
            page=req.query.page
        }

        let limit=9

        let skip=(page-1)*limit
        let search=''

        if(req.query.search){
            search=req.query.search
        }

         const gt=  Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt
        const lt=  Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt

        const categoryId=req.query.category
        let sort= ''
        if(req.query.sort){
            sort=req.query.sort
        }

        const sortQuery={
            priceHigh:{salePrice:-1},
            priceLow:{salePrice:1},
            az:{productName:1},
            za:{productName:-1}
        }


        const filter={
            isBlocked:false,
            productName:{$regex:".*"+search+".*",$options:"i"}
        }

        const products= await Product.find(filter)
        .sort(sortQuery[sort]||{})
        .collation({locale:'en',strength:2})
        .skip(skip)
        .limit(limit)

        const totalProducts= await Product.countDocuments(filter)

        const totalPages= Math.ceil(totalProducts/limit)

        const category= await Category.find({isListed:true})

        res.render("user/shop",{
            products,
            category,
            currentPage:page,
            totalPages,
            search,
            sort,
            categoryId,
            gt,
            lt
        })
        
    } catch (error) {
        
        console.error("Error in loadin shopping page :",error.message);
        res.status(500).send("server error")
        
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


export const login = async(req,res)=>{

    try {
        
        const {email,password}=req.body

        const existingUser= await User.findOne({email})

        if(!existingUser){
            return res.render("admin/login",{error:"Email not found"})
        }

        if(existingUser.isBlocked){

             return res.render("admin/login",{error:"User blocked by Admin"})
        }

        const passwordMatched= await bcrypt.compare(password,existingUser.password)

        if(!passwordMatched){
             return res.render("admin/login",{error:"Password didn't match"})
        }

        return res.redirect("/")

    } catch (error) {
        
        console.error("Error in post login");

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
        console.log("otp from req.body ",otp);
        

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

    try {
        const userData=req.session.userData;

        if(!userData|| !userData.email){
            return res.status(400).json({
                success:false,
                message:"Session Expired. Please signup again."
            })
        }

        const email=userData.email;

        const otp=generateOtp();
        req.session.userOtp=otp;
        req.session.otpExpires=Date.now()+60*1000;

        const emailSent= await sendVerificationEmail(email,otp);

        if(emailSent){
            console.log("Resend OTP : ",otp);

            return res.status(200).json({
                success:true,
                message:"OTP resent successfully."
            })
            
        }else{
            return res.status(500).json({
                success:false,
                message:"Failed to resen OTP. Please try again."
            })
        }
    } catch (error) {
        console.error("Error resending OTP : ",error.message);

        return res.status(500).json({
            success:false,
            message:"Internal Server Error. Please try again."
        })
                
    }

}
