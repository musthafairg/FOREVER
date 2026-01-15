import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import ProductOffer from "../../models/productofferModel.js";
import CategoryOffer from "../../models/categoryofferModel.js";



export const loadProductOffers=async(req,res)=>{

    const products=await Product.find({isBlocked:false})
    const offers=await ProductOffer.find().populate("productId")

    res.render("admin/product-offers",{
        page:"offers",
        products,
        offers
    })
}


export const addProductOffer=async(req,res)=>{
    let {productId,discount}=req.body

    console.log("req.body",req.body)


    
    await ProductOffer.findOneAndUpdate(
        {productId},
        {discount,isActive:true},
        {upsert:true,new:true}
    )
    
    res.redirect("/admin/offers/product")
}


export const toggleProductOffer=async(req,res)=>{
    const offer= await ProductOffer.findById(req.params.id)
    offer.isActive= !offer.isActive

    await offer.save()


    res.redirect("/admin/offers/product")
}



export const loadCategoryOffers=async(req,res)=>{

    const categories= await Category.find()
    const offers= await CategoryOffer.find().populate("categoryId")


    res.render("admin/category-offers",{
        page:"offers",
        categories,
        offers
    })
}




export const addCategoryOffer=async(req,res)=>{
    const {categoryId,discount}=req.body

    console.log("req.body",req.body)

    await CategoryOffer.findOneAndUpdate(
        {categoryId},
        {discount,isActive:true},
        {upsert:true,new:true}
    )
    res.redirect("/admin/offers/category")
}


export const toggleCategoryOffer=async(req,res)=>{
    const offer= await CategoryOffer.findById(req.params.id)
    offer.isActive= !offer.isActive

    await offer.save()


    res.redirect("/admin/offers/category")
}




