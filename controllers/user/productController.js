
import User from '../../models/userModel.js';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';
import { populate } from 'dotenv';








export const getProductDetailsPage= async(req,res)=>{
    try {

        const user= req.session.user
        const id=req.query.id;

        const category=await Category.find({isListed:true})

        const product= await Product.findById(id)
        .populate('category')
        .populate({
            path:'reviews.user',
            select:"name email"
        })

         if(!product||product.isBlocked||product.status==="Discontinued"){
            return res.redirect("/shop")
        }



        let totalOffer= Math.ceil((product.regularPrice-product.salePrice)/product.regularPrice*100)

       
        const latestreviews= product.reviews
            .reverse()
            .slice(0,6)


            const relatedProducts= await Product.find({
                category:product.category._id,
                _id:{$ne:product._id},
                isBlocked:false,
                status:"Available"
            }).limit(5)


            console.log("related",relatedProducts);
            
        res.render("user/productDetails",{
            product,
            totalOffer,
            category:category,
            user,
            latestreviews,
            relatedProducts

        })
    } catch (error) {

        console.error("Error fetching product details: ",error.message)
        return res.status(500).send("Internal Server Error")
        
    }
}

export const addReview= async(req,res)=>{
    try {
        
        const userId= req.session.user?._id
        if(!userId){
            return res.redirect("/login")
        }

        const {productId,rating,comment}=req.body

        const product= await Product.findById(productId)

        if(!product||product.isBlocked||product.status==="Discontinued"){
            return res.redirect("/shop")
        }

        product.reviews.push({
            user:userId,
            rating:Number(rating),
            comment
        })

        const totalRating= product.reviews.reduce((sum,r)=>sum+r.rating,0)
        product.avgRating= totalRating/product.reviews.length

        await product.save()

        return res.redirect(`/productDetails?id=${productId}`)
    } catch (error) {
        
        console.error("Error adding Review :",error.message);
        return res.status(500).send("Internal Server Error")
        
    }
}

export const filterByPrice=async(req,res)=>{
    try {

    
        const user=req.session.user
        
        const gt=  Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt
        const lt=  Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt

        const categoryId=req.query.category
        let page=1
        if(req.query.page){
            page=req.query.page
        }

        let search=''
        if(req.query.search){
            search=req.query.search
        }
        let sort=''
        if(req.query.sort){
            sort=req.query.sort
        }


        
        let limit=9

        let skip=(page-1)*limit

        const sortQuery={
            priceHigh:{salePrice:-1},
            priceLow:{salePrice:1},
            az:{productName:1},
            za:{productName:-1}
        }


        const category= await Category.find({isListed:true})


        const products= await Product.find({
            isBlocked:false,
            productName:{$regex:".*"+search+".*",$options:"i"},
            salePrice:{$gt:gt,$lt:lt},
    })
    .sort(sortQuery[sort]||{})
    .collation({locale:'en',strength:2})
    .skip(skip)
    .limit(limit)
    .lean()


        const totalProducts= await Product.find({
            isBlocked:false,
            productName:{$regex:".*"+search+".*",$options:"i"},
            salePrice:{$gt:gt,$lt:lt},
    }).countDocuments()

    const totalPages= Math.ceil(totalProducts/limit)
        res.render("user/shop",{
            products,
            currentPage:page,
            totalPages,
            search,
            category,
            sort,
            categoryId,
            gt:Number(gt),
            lt:Number(lt),
            user
        })
    } catch (error) {
        
        console.error("Error in Filter By Price :",error.message)

        res.status(500).send("Server Error")
        
    }
}


export const filter= async(req,res)=>{
    try {

        const user=req.session.user
        
        const categoryId=req.query.category

        let page=1
        if(req.query.page){
            page=req.query.page
        }
        let search=''
        if(req.query.search){
            search=req.query.search
        }

        let sort=''
        if(req.query.sort){
            sort=req.query.sort
        }

         const gt=  Array.isArray(req.query.gt) ? req.query.gt[0] : req.query.gt
        const lt=  Array.isArray(req.query.lt) ? req.query.lt[0] : req.query.lt

        let limit=9
        let skip= (page-1)*limit


        const filterQuery={
            isBlocked:false,
            productName:{$regex:".*"+search+".*",$options:"i"},
            quantity:{$gt: 0}
        }

        if(categoryId){
            filterQuery.category=categoryId
        }

        const sortQuery={
            priceHigh:{salePrice:-1},
            priceLow:{salePrice:1},
            az:{productName:1},
            za:{productName:-1}
        }


        const totalProducts= await Product.countDocuments(filterQuery)

        const totalPages= Math.ceil(totalProducts/limit)
        const products= await Product.find(filterQuery)
        .sort(sortQuery[sort]||{})
        .collation({locale:'en',strength:2})
        .skip(skip)
        .limit(limit)
        .lean()

        const category= await Category.find({isListed:true})

        res.render("user/shop",{
            products,
            currentPage:page,
            totalPages,
            category,
            search,
            sort,
            categoryId,
            gt,
            lt,
            user

        })

    } catch (error) {
        
        console.error("Error in filter :",error.message);
        res.status(500).send("Server Error")
        
    }
}