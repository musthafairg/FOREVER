import bcrypt from 'bcrypt'
import 'dotenv/config'
import nodemailer from 'nodemailer'



export const securePassword= async(password)=>{
    try {
        const passwordHash= await bcrypt.hash(password,10);
        return passwordHash;
    } catch (error) {
        console.error("Password Hash Error :",error.message);
        
        
    }
}


export const generateOtp = ()=>{
    return Math.floor(100000+Math.random()*900000).toString();

}


export const sendVerificationEmail= async(email,otp)=>{
  try {
    const transporter=nodemailer.createTransport({
      service:'gmail',
    
      auth:{
        user:process.env.NODEMAILER_EMAIL,
        pass:process.env.NODEMAILER_PASSWORD
      }
    })

    const info=await transporter.sendMail({
      from:process.env.NODEMAILER_EMAIL,
      to:email,
      subject:"Verify your account",
      text:`Your OTP is ${otp}`,
      html:`<b>Your OTP : ${otp}</b>`,

    })
    return info.accepted.length>0

  } catch (error) {
    
    console.error("Error sending email",error.message);
    return false;
    
  }
}