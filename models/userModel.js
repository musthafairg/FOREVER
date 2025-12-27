import mongoose, { Schema } from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim :true
    },
    email: {
      type: String,
      required: true,
      unique:true,
      trim:true
    },
    mobile: {
      type: String,
      required: false,
      unique:false,
      sparse:true,
      default:null
    }, 
    googleId:{
      type:String,
      unique:true,
      sparse:true
    },
    password: {
      type: String,
      required: false,
    },
    profileImage:{
      type:String,
      default: "default-profile.avif"
    },
    isBlocked: {
      type: Boolean,
      default: false,
    },
    isAdmin:{
      type:Boolean,
      default:false

    },
    referalCode:{
      type:String,
    },
    redeemed:{
      type:Boolean
    },
    redeemedUsers:[{
      type:Schema.Types.ObjectId,
      ref:"User"
    }],
  },{timestamps:true}
);



const User = mongoose.model("User", userSchema);
export default User;