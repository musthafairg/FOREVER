import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";




export const categoryInfo= async(req,res)=>{

    try {
        
         let search=""
        if(req.query.search){
            search=req.query.search
        }

        let page=1
        if(req.query.page){
            page=req.query.page;
        }
        let limit=5;
        let skip=(page-1)*limit
        const categoryData= await Category.find({name:{$regex:".*"+search+".*",$options:"i"}})
        .sort({createdAt:-1})
        .skip(skip)
        .limit(limit)
        .exec()

        const totalCategories= await Category.find({name:{$regex:".*"+search+".*",$options:"i"}}).countDocuments()

        const totalPages= Math.ceil(totalCategories/limit)

        return res.render("admin/category",{
            page:"category",
            currentPage:page,
            totalPages,
            data:categoryData,
            totalCategories,
            search

        })

    } catch (error) {

        console.error("Error in CategoryInfo ",error.message);

        res.status(500).send("Server Error")
        
        
    }
}




export const getAddCategoryPage= async(req,res)=>{

    try {
        res.render("admin/addNewCategory",{
            page:'category'
        })
    } catch (error) {
        console.error("Error in addCategory page loading : ",error.message);
        res.status(500).send("Server Error")
        
    }
}


export const addCategory= async(req,res)=>{
    try {
        
        const {name,description,offer}=req.body;

        const categoryData=new Category({
            name:name,
            description:description,
            categoryOffer:offer
        })

        await categoryData.save()
        console.log("New Category Saved Successfully : ",categoryData);
        

        return res.redirect("/admin/category");

    } catch (error) {
        
    }
}


export const listCategory=  async(req,res)=>{
    try {
        const id=req.query.id;

        await Category.updateOne({_id:id},{$set:{isListed:true}})

        return res.redirect("/admin/category")
    } catch (error) {
        console.error("Error in listing category :",error.message);
        res.status(500).send("Server Error")
        
    }
}

export const unlistCategory=  async(req,res)=>{
    try {
        const id=req.query.id;

        await Category.updateOne({_id:id},{$set:{isListed:false}})
        return res.redirect("/admin/category")
    } catch (error) {
        console.error("Error in listing category :",error.message);
        res.status(500).send("Server Error")
        
    }
}

export const geteditCategoryPage= async(req,res)=>{

    try {

        req.session.editId=req.query.id;

        const category= await Category.findById(req.query.id)

        res.render("admin/editCategory",{
            category,
            page:'category'
        })
    } catch (error) {
        console.error("Error in addCategory page loading : ",error.message);
        res.status(500).send("Server Error")
        
    }
}



export const editCategory= async(req,res)=>{
    try {

        const id=req.session.editId
        console.log("idddddddddddddddd",id);
        
        
        const {name,description,offer}=req.body;

        console.log(name,description,offer)



        await Category.updateOne({_id:id},{$set:{name,description,categoryOffer:offer}})
        console.log("Category updatedd Successfully ");
        

        return res.redirect("/admin/category");

    } catch (error) {
        console.error("Error in Edit category : ",error.message);

        return res.status(500).send("Server Error")
        
        
    }
}
