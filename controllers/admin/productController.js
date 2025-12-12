import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import fs from 'fs'
import path from 'path'
import { dirname } from "path"
import { fileURLToPath } from "url"
import sharp from 'sharp'
import { promisify } from "util"
import { error } from "console";

const unlinkAsync   =   promisify(fs.unlink)

const _filname  =   fileURLToPath(import.meta.url)
const _dirname  =   path.dirname(_filname)



export const getAddProductPage= async(req,res)=>{
    try {


        const categoryData=await Category.find({isListed:true})

        res.render("admin/addProducts",{page:"addProducts",categoryData})
    } catch (error) {

        console.error("Error in loading addProducts page :",error.message);

        return res.status(500).send("Server Error")
        
    }
}


export const addProducts=   async(req,res)=>{

    const originalFilePaths= req.files ? req.files.map((file)=>file.path):[]

    console.log(originalFilePaths);
    

    try {
        
        const products= req.body
        console.log("products Data",products);
        

        const productExists =   await Product.findOne({
            productName:products.productName,
        })

        if(!productExists){
            const images=[]

            if(req.files&& req.files.length>0){
                for (let i=0; i<req.files.length; i++){
                    const filename= req.files[i].filename
                    const originalImagePath= req.files[i].path

                    const updatedName=  `${Date.now()}-${filename}`
                    const resizedImagePath= path.join("public","uploads","image",updatedName)

                    await sharp(originalImagePath).toFile(resizedImagePath)

                    images.push(updatedName)
                }
            }

            const categoryDoc   =    await Category.findOne({name:products.category})
        
            if(!categoryDoc){
                return res.redirect("/admin/addProducts?error=Invalid+category+name")
            }

            const newProduct    = new Product({
                productName:products.productName,
                description:products.descriptionData,
                category:categoryDoc._id,
                regularPrice:products.regularPrice,
                salePrice:products.salePrice,
                quantity:products.quantity,
                productImage:images,
                status:"Available"
            })

            await newProduct.save()

            return res.redirect("/admin/addProducts")
        }else{
            return res.redirect("/admin/addProducts?error=Product+already+exists")
        }
    } catch (error) {
        
        console.error("Error saving product :",error.message)
        res.status(500).send("Server Error")
        
    }finally{
        for(const filePath of originalFilePaths){
            try {

                await unlinkAsync(filePath)
            } catch (error) {
                console.error(`Failed to delete temporary file : ${filePath}`,error.message);
                
            }
        }
    }
}



export const productInfo= async(req,res)=>{
    try {
        
        let search=''
        if(req.query.search){
            search=req.query.search
        }

        let page=1

        if(req.query.page){
            page=req.query.page
        }

        let limit =5

        let skip= (page-1)*limit

        const category= await Category.find({isListed:true})
        
        
        const productData= await Product.find({
            productName:{$regex:".*"+search+".*",$options:"i"}
        })
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .populate('category')
        .exec()

        const totalProducts= await Product.find({
            productName:{$regex:".*"+search+".*",$options:"i"}
        }).countDocuments()

        const totalPages=Math.ceil(totalProducts/limit)

if(category){
        res.render("admin/products",{
            page:"products",
            data:productData,
            currentPage:page,
            totalPages,
            search,
            


        })
    }

    } catch (error) {
        
        console.error("Error in loading products page: ",error.message);
        return res.status(500).send("Server Error")
        
    }
}


export const blockProduct=  async(req,res)=>{
    try {
        
        const id=req.query.id

        await Product.updateOne({_id:id},{$set:{isBlocked:true}})
        return res.redirect("/admin/products")
    } catch (error) {
        console.error("Error in Block Product : ",error.message);
        return res.status(500).send("Server Error")
        
    }
}

export const unblockProduct=  async(req,res)=>{
    try {
        
        const id=req.query.id

        await Product.updateOne({_id:id},{$set:{isBlocked:false}})

        return res.redirect("/admin/products")
    } catch (error) {
        console.error("Error in Block Product : ",error.message);
        return res.status(500).send("Server Error")
        
    }
}


export const getEditProduct= async(req,res)=>{
    try {
        
        const id= req.query.id;
        req.session.productId=id

        const product= await Product.findOne({_id:id})
        const category= await Category.find({isListed:true})

        res.render("admin/editProduct",{
            product,
            category,
            page:"products",
            
        })
    } catch (error) {
        console.error("Error in loading Edit Product page :",error.message);
        return res.status(500).send("Server Error")
        
    }
}


export const editProduct= async(req,res)=>{
    try {
        
        const id= req.params.id

        const product= await Product.findById(id)
        console.log("aaaaaaaaaaaa",product);
        

        if(!product){
            return res.redirect("/admin/editProduct?error=Product+not+found")
        }



        const productData= req.body
        console.log(req);
        
        console.log("req.body",req.body);
        
        console.log("bbbbbbbbbb",productData);
        
        
        const existProductName= await Product.findOne({
            productName:productData.productName,
            _id:{$ne:id}
        })

        if(existProductName){
            return res.redirect("/admin/editProduct?error=Product+with+this+name+already+exists.+please+try+with+another+name")
        }

         const images=[]

            if(req.files&& req.files.length>0){
                for (let i=0; i<req.files.length; i++){
                    const filename= req.files[i].filename
                    const originalImagePath= req.files[i].path

                    const updatedName=  `${Date.now()}-${filename}`
                    const resizedImagePath= path.join("public","uploads","image",updatedName)

                    await sharp(originalImagePath).toFile(resizedImagePath)

                    images.push(updatedName)
                }
            }

            const categoryDoc   =    await Category.findOne({name:productData.category})
        
            if(!categoryDoc){
                return res.redirect("/admin/editProduct?error=Invalid+category+name")
            }

            await Product.findByIdAndUpdate(id,{
                productName:productData.productName,
                description:productData.descriptionData,
                regularPrice:productData.regularPrice,
                salePrice:productData.salePrice,
                quantity:productData.quantity,
                category:categoryDoc._id,
                $push:{productImage:{$each:images}}
            })

            return res.redirect("/admin/products")
    } catch (error) {
        
         console.error("Error Updating product :",error.message)
        res.status(500).send("Server Error")
    }
}


export const deleteSingleImage= async(req,res)=>{

    try {


        
        const {imageNameToServer,productIdToServer}=req.body

        console.log("req.body", req.body);
        

        if(!imageNameToServer||!productIdToServer){
            return res.json({status:false,message:"Invalid Request"})
        }

        await Product.findByIdAndUpdate(productIdToServer,{
            $pull:{productImage:imageNameToServer}
        })

        const imagePath= path.join("public","uploads","image",imageNameToServer)

        if(fs.existsSync(imagePath)){
            fs.unlinkSync(imagePath)
            console.log("Deleted image file", imagePath);
            
        }else{
            console.log("Image file not found :",imagePath);
            
        }

        return res.json({status:true})
    } catch (error) {
        console.error("Error deleting single image", error.message);

        return res.status(500).send("Server Error")
        
    }
}