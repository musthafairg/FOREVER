import User from "../../models/userModel.js";
import bcrypt from 'bcrypt'

export const loadLogin= async(req,res)=>{
    try {
        if(req.session.admin){
            return res.redirect("/admin/")
        }
       return  res.render("admin/login")
    } catch (error) {
        console.error("admin Login page not loading : ",error.message);

       return  res.status(500).send("Server Error")
            
    }
}


export const login= async(req,res)=>{
    try {
        
        const {email,password}=req.body;
        console.log("admin :",email,password);

        const admin=await User.findOne({email,isAdmin:true});

        if(admin){
            const passwordMatch=await bcrypt.compare(password,admin.password)

            if(passwordMatch){
                console.log("Password matched in admin login");

                req.session.admin=admin._id;
                return res.json({ success:true})
                
            }else{
                console.log("password didn't match in admin login ");
                return res.json({
                    success:false,
                    message:"Password do not match"
                })
                
            }
        }else{
            console.log("admin not found");
            return res.json({
                success:false,
                message:"Email not found"
            })
        }
        
    } catch (error) {
        console.error("Admin Login Post error : ",error.message);
        return res.status(500).json({
            success:false,
            message:"Server Error"
        })
        
    }
}

export const loadDashboard= async(req,res)=>{
    
    

        try {


           return res.render("admin/dashboard",{page:"dashboard"})         
        } catch (error) {
            console.error("Admin Dashboard page not loading : ",error.message);
           return res.status(500).send("Server Error")
            
        }
    
    
  
}


export const logout= async(req,res)=>{
    try {
        req.session.destroy(err=>{
            if(err){
                console.error("Error during session destroy in admin");
                res.status(500).send("server error")
            }
            return res.redirect("/admin/login")
        })
    } catch (error) {
            console.error("Error in admin logout : ",error.message);
            return res.status(500).send("Server Error")
            
    }
}