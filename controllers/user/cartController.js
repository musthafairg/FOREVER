import Cart from "../../models/cartModel.js";
import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import User from "../../models/userModel.js"
import {applyBestOffer } from "../../utils/applyBestOffer.js";
const Max_QUANTITY_PER_PRODUCT = 5;


export const loadCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const cart = await Cart.findOne({ userId })
      .populate({
        path: "items.productId",
        populate: { path: "category" }
      });

    if (!cart || cart.items.length === 0) {
      return res.render("user/cart", {
        user,
        cart: null,
        subtotal: 0
      });
    }

    cart.items = cart.items.filter(item => {
      const p = item.productId;
      return (
        p &&
        !p.isBlocked &&
        p.status === "Available" &&
        p.quantity > 0
      );
    });

    let subtotal = 0;

   
    const cartItemsWithOffer = await Promise.all(
      cart.items.map(async item => {
        const offer = await applyBestOffer(item.productId);

        const itemTotal = offer.finalPrice * item.quantity;
        subtotal += itemTotal;

        return {
          ...item.toObject(),
          finalPrice: offer.finalPrice,
          originalPrice: offer.originalPrice,
          discountPercent: offer.discountPercent,
          itemTotal
        };
      })
    );

    res.render("user/cart", {
      user,
      cart: { ...cart.toObject(), items: cartItemsWithOffer },
      subtotal
    });

  } catch (error) {
    console.error("Load cart error:", error.message);
    res.status(500).send("Server Error");
  }
};

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const { productId,quantity=1 } = req.body;

    const product = await Product.findById(productId);

    if (
      !product ||
      product.isBlocked ||
      product.status !== "Available" ||
      product.quantity <= 0
    ) {
      return res.json({
        success: false,
        message: "Product unavailable",
      });
    }

    const category = await Category.findById(product.category);

    if (!category || !category.isListed) {
      return res.json({
        success: false,
        message: "Category unavailable",
      });
    }

    if(quantity>product.quantity||quantity>Max_QUANTITY_PER_PRODUCT){
return res.json({
        success: false,
        message: "Quantity exceeds allowed limit",
      });
    }

    let cart = await Cart.findOne({ userId });

    if (!cart) {
      cart = new Cart({
        userId,
        items: [{ productId, quantity }],
      });
    } else {
      const itemIndex = cart.items.findIndex(
        (item) => item.productId.toString() === productId
      );

      if (itemIndex > -1) {

        const newQuantity=cart.items[itemIndex].quantity+quantity
        if (newQuantity >Math.min(product.quantity,Max_QUANTITY_PER_PRODUCT)) {
          return res.json({
            success: false,
            message: "Maximum limit reached",
          });
        }
        
        cart.items[itemIndex].quantity = newQuantity;
      } else {
        cart.items.push({ productId, quantity });
      }
    }
    await cart.save();

    return res.json({
      success: true,
      message: "Added to cart",
    });
  } catch (error) {
    console.error("Add to cart error : ", error.message);
    return res.status(500).json({
      success: false,
    });
  }
};



export const updateCartQuantity=async(req,res)=>{
  try {

    const {productId,action}=req.body
    const userId=req.session.user._id

    const cart=await Cart.findOne({userId})
    if(!cart){
      return res.json({
        success:false,
        message:"Cart not found"
      })
    }
    const item=cart.items.find(i=>i.productId.toString()===productId)

    if(!item)return res.json({
      success:false,
      message:"Item not found"
    })
      const product=await Product.findById(productId)

    if(product.isBlocked||
      product.status!=="Available"||
      product.quantity<=0
    ){
      return res.json({success:false,message:"Product unavailable"})
    }

    if(action==="inc"){
      if(item.quantity>=product.quantity||item.quantity>=Max_QUANTITY_PER_PRODUCT){
        return res.json({
          success:false,
          message:"Limit reached"
        })
      
      }
      item.quantity++;

    }

    if(action==="dec" && item.quantity >1){
      item.quantity--;
    }
    

    await cart.save()

    return res.json({
      success:true,
      quantity:item.quantity
    })
  } catch (error) {
    console.error("Update cart qty error:", error);
    return res.status(500).json({ success: false });
  }
}

export const removeFromCart=async(req,res)=>{
  try {
    
    const userId= req.session.user._id
    const {productId}=req.body

    await Cart.updateOne(
      {userId},
      {$pull:{items:{productId}}}
    )

    res.json({success:true})
  } catch (error) {
    
    console.error("Remove cart item error :",error.message)
    res.status(500).json({success:false})
    
  }
}


