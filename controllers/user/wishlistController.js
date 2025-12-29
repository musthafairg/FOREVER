import Wishlist from "../../models/wishlistModel.js"
import Product from "../../models/productModel.js"
import User from "../../models/userModel.js"


export const loadWishlist =async(req,res)=>{
    try {
        
        const userId= req.session.user._id

        const user= await User.findById(userId)

        const wishlist= await Wishlist.findOne({userId})
        .populate("products")

        if(!wishlist || wishlist.products.length===0){
            return res.render("user/wishlist",{
                user,
                products:[]
            })
        }

        const validProducts= wishlist.products.filter(p=>
            p&&
            !p.isBlocked&&
            p.status==="Available"
        )

        res.render("user/wishlist",{
                user,
                products:validProducts
            })
        
    } catch (error) {

        console.error("Load wishlist error :",error.message)
        res.status(500).send("Server error")
        
    }
}



export const addToWishlist =async(req,res)=>{
    try {
        
        const userId= req.session.user._id
        const {productId}=req.body

        let wishlist= await Wishlist.findOne({userId})

        if(!wishlist){
            wishlist= new Wishlist({
                userId,
                products:[productId]
            })
        }else{
            const exists= wishlist.products.some(
                p=>p.toString()===productId
            )

            if(exists){
                wishlist.products.pull(productId)
            }else{
                wishlist.products.push(productId)
            }
        }

        await wishlist.save()

        res.json({success:true})

    } catch (error) {
        
        console.error("Add to wishlist  error :",error.message)
        res.status(500).json({success:false})
        
    }
}



export const removeFromWishlist=async(req,res)=>{
    try {
        
         const userId= req.session.user._id
        const {productId}=req.body

        await Wishlist.updateOne(
            {userId},
            {$pull:{products:productId}}
        )

        res.json({success:true})

    } catch (error) {
        
        console.error("Remove Wishlist error :",error.message)
        res.status(500).json({success:false})
        
    }
}
