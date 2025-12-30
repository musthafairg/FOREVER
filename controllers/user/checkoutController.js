import Cart from '../../models/cartModel.js'
import Address from '../../models/addressModel.js'
import Product from '../../models/productModel.js'
import User from '../../models/userModel.js'



export const loadCheckout=async(req,res)=>{
    try {
        
        const userId=req.session.user._id

        const user= await User.findById(userId)

        const cart =await Cart.findOne({userId})
        .populate("items.productId")

        if(!cart|| cart.items.length===0){
            return res.redirect("/cart")
        }

        const validItems= cart.items.filter(item=>{
            const p= item.productId
            return(
                p&&
                !p.isBlocked&&
                p.status==="Available"&&
                p.quantity>=item.quantity
            )
        })

        if(validItems.length===0){
            return res.redirect("/cart")
        }

        cart.items= validItems
        await cart.save()

        let subtotal=0

        cart.items.forEach(item=>{
            subtotal+= item.productId.salePrice*item.quantity
        })

        const shipping=0
        const discount=0
        const tax= Math.round(subtotal*0.05)
        const total= subtotal + tax+ shipping-discount

        const addressData= await Address.findOne({userId})

        const addresses= addressData ? addressData.address: [];

        const defaultAddress= addresses.find(a=>a.isDefault)||null

        res.render("user/checkout",{
            user,
            cart,
            addresses,
            defaultAddress,
            subtotal,
            discount,
            shipping,
            total,
            tax
        })
    } catch (error) {
        
        console.error("Checkout load error :",error.message)
        res.status(500).send("Server Error")
        
    }
}