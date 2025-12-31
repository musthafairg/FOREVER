import mongoose, { Schema } from "mongoose";



const orderItemSchema= new Schema({
    productId:{
        type:Schema.Types.ObjectId,
        ref:"Product",
        required:true
    },
    productName:String,
    productImage:String,
    price:Number,
    quantity:Number,
    itemTotal:Number,
    isCancelled:{
        type:Boolean,
        default:false
    },
    cancelReason:String
})

const orderSchema = new Schema({

    orderId:{
        type:String,
        required:true,
        unique:true
    },
    userId:{
        type:Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    items:[orderItemSchema],
    address:{
        name:String,
        houseName:String,
        place:String,
        city: String,
        district: String,
        state: String,
        pincode: Number,
        phone: String
    },
    priceDetails:{
        subtotal:Number,
        discount:Number,
        tax:Number,
        shipping:Number,
        total:Number
    },
    paymentMethod:{
        type:String,
        enum:["COD"],
        default:"COD"
    },
    orderStatus:{
        type:String,
        enum:[
            "Placed",
            "Shipped",
            "Out for Delivery",
            "Delivered",
            "Cancelled",
            "Returned"
        ],
        default:"Placed"
    },
    cancelReason:String,
    returnReason:String,

    isReturned:{
        type:Boolean,
        default:false
    }
   
},
 {timestamps:true}
)


const Order = mongoose.model("Order", orderSchema);
export default Order;
