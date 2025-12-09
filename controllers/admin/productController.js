import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";
import fs from 'fs'
import path from 'path'
import { dirname } from "path"
import { fileURLToPath } from "url"
import sharp from 'sharp'
import { promisify } from "util"

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