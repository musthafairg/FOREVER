
import User from '../../models/userModel.js';
import Product from '../../models/productModel.js';
import Category from '../../models/categoryModel.js';








export const getProductDetailsPage= async(req,res)=>{
    try {
        
        const id=req.query.id;

        const category=await Category.find({isListed:true})

        const product= await Product.findById(id).populate('category')

        let totalOffer= Math.ceil((product.regularPrice-product.salePrice)/product.regularPrice*100)

       

        res.render("user/productDetails",{
            product,
            totalOffer,
            category:category

        })
    } catch (error) {
        
    }
}

export const filterByPrice=async(req,res)=>{
    try {

    
        
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
            lt:Number(lt)
        })
    } catch (error) {
        
        console.error("Error in Filter By Price :",error.message)

        res.status(500).send("Server Error")
        
    }
}


export const filter= async(req,res)=>{
    try {
        
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
            lt

        })

    } catch (error) {
        
        console.error("Error in filter :",error.message);
        res.status(500).send("Server Error")
        
    }
}