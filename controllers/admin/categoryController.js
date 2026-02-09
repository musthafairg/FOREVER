import Product from "../../models/productModel.js";
import Category from "../../models/categoryModel.js";

export const categoryInfo = async (req, res) => {
  try {
    let search = "";
    if (req.query.search) {
      search = req.query.search;
    }

    let page = 1;
    if (req.query.page) {
      page = req.query.page;
    }
    let limit = 5;
    let skip = (page - 1) * limit;
    const categoryData = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .exec();

    const totalCategories = await Category.find({
      name: { $regex: ".*" + search + ".*", $options: "i" },
    }).countDocuments();

    const totalPages = Math.ceil(totalCategories / limit);

    return res.render("admin/category", {
      page: "category",
      currentPage: page,
      totalPages,
      data: categoryData,
      totalCategories,
      search,
    });
  } catch (error) {
    console.error("Error in CategoryInfo ", error.message);

    res.status(500).render("admin/errors/500", {
      page: "category",
    }); 
  }
};

export const getAddCategoryPage = async (req, res) => {
  try {
    res.render("admin/addNewCategory", {
      page: "category",
    });
  } catch (error) {
    console.error("Error in addCategory page loading : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "category",
    });
  }
};
export const addCategory = async (req, res) => {
  try {
    let { name, description, offer } = req.body;

   
    name = name.trim();

   
    const existingCategory = await Category.findOne({
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category already exists"
      });
    }

    const categoryData = new Category({
      name,
      description,
      categoryOffer: offer
    });

    await categoryData.save();

    return res.status(200).json({
      success: true,
      message: "Add new category successfully",
      redirect: "/admin/category"
    });

  } catch (error) {
    console.error("Error in addCategory:", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    }).render("admin/errors/500", {
      page: "category",
    });
  }
};

export const listCategory = async (req, res) => {
  try {
    const id = req.query.id;

    await Category.updateOne({ _id: id }, { $set: { isListed: true } });

    return res.redirect("/admin/category");
  } catch (error) {
    console.error("Error in listing category :", error.message);
    res.status(500).render("admin/errors/500", {
      page: "category",
    });
  }
};

export const unlistCategory = async (req, res) => {
  try {
    const id = req.query.id;

    await Category.updateOne({ _id: id }, { $set: { isListed: false } });
    return res.redirect("/admin/category");
  } catch (error) {
    console.error("Error in listing category :", error.message);
    res.status(500).render("admin/errors/500", {
      page: "category",
    });
  }
};

export const geteditCategoryPage = async (req, res) => {
  try {
    req.session.editId = req.query.id;

    const category = await Category.findById(req.query.id);

    res.render("admin/editCategory", {
      category,
      page: "category",
    });
  } catch (error) {
    console.error("Error in addCategory page loading : ", error.message);
    res.status(500).render("admin/errors/500", {
      page: "category",
    });
  }
};


export const editCategory = async (req, res) => {
  try {
    const id = req.session.editId;
    let { name, description, offer } = req.body;

    name = name.trim();

    
    const existingCategory = await Category.findOne({
      _id: { $ne: id },
      name: { $regex: `^${name}$`, $options: "i" }
    });

    if (existingCategory) {
      return res.status(400).json({
        success: false,
        message: "Category name already exists"
      });
    }

    await Category.updateOne(
      { _id: id },
      { $set: { name, description, categoryOffer: offer } }
    );

    return res.status(200).json({
      success: true,
      message: "Edit category successfully",
      redirect: "/admin/category"
    });

  } catch (error) {
    console.error("Error in Edit category :", error.message);
    return res.status(500).json({
      success: false,
      message: "Internal Server Error"
    }).render("admin/errors/500", {
      page: "category", 
    });
  }
};
 