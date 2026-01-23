import Coupon from "../../models/couponModel.js"



export const loadCoupons=async(req,res)=>{
   try {

        const coupons= await Coupon.find().sort({createdAt:-1})

        res.render("admin/coupons",{
            page:"offers",
            coupons
        })
    
   } catch (error) {
    
    console.error("Load Coupons Error:",error.message);
    res.status(500).send("Server Error")
    
   }
}
export const createCoupon = async (req, res) => {
  try {
    let {
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
    } = req.body;

    code = code.toUpperCase();

    const exists = await Coupon.findOne({ code });
    if (exists) {
      req.session.formErrors = { code: "Coupon already exists" };
      req.session.formData = req.body;
      return res.redirect("/admin/coupons");
    }

    await Coupon.create({
      code,
      discountType,
      discountValue,
      minPurchase,
      maxDiscount,
      expiryDate,
      usageLimit,
    });

    res.redirect("/admin/coupons");
  } catch (error) {
    console.error("Create Coupon Error:", error.message);
    res.status(500).send("Server Error");
  }
};


export const toggleCoupon= async(req,res)=>{
    try {
        const coupon=await Coupon.findById(req.params.id)

        coupon.isActive=!coupon.isActive
        await coupon.save()

        res.redirect("/admin/coupons")

    } catch (error) {
        console.error("Toggle Coupon Error:", error.message)
        res.status(500).send("Server Error")
    }
}


export const deleteCoupon=async(req,res)=>{

    try {

        await Coupon.findByIdAndDelete(req.params.id)

        res.redirect("/admin/coupons")
    } catch (error) {
           console.error("Delete Coupon Error:", error.message)
          res.status(500).send("Server Error")
    }
}