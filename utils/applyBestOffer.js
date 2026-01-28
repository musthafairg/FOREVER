import ProductOffer from "../models/productofferModel.js"
import CategoryOffer from "../models/categoryofferModel.js"



export const applyBestOffer= async(product)=>{

    let productDiscount=0
    let categoryDiscount=0

    const productoffer=await ProductOffer.findOne({
        productId:product._id,
        isActive:true
    })

    if(productoffer){
        productDiscount=productoffer.discount
    }

    const categoryoffer=await CategoryOffer.findOne({
        categoryId:product.category,
        isActive:true
    })

    if(categoryoffer){
        categoryDiscount=categoryoffer.discount
    }

  

    const finalDiscount= Math.max(productDiscount,categoryDiscount)

   

    const discountedPrice= finalDiscount>0 ? Math.round(product.regularPrice-(product.regularPrice*finalDiscount/100)) : product.regularPrice
    

    
    return {
        originalPrice:product.regularPrice,
        finalPrice:discountedPrice,
        discountPercent:finalDiscount,
        appliedOffer:finalDiscount===productDiscount ? "PRODUCT" : finalDiscount===categoryDiscount ? "CATEGORY" : null
        
    }
}