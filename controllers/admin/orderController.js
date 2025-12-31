import Order from '../../models/orderModel.js'
import User from '../../models/userModel.js'



export const loadAdminOrders=async(req,res)=>{
    try {
        const {
            search="",
            status="",
            page=1,
            sort="latest",

        }=req.query

        const limit =8
        const skip=(page-1)*limit

        let query={}

        if(search){
            const users=await User.find({
                $or:[
                    {name:{$regex:search, $options: "i"}},
                    {email:{$regex: search, $options: "i"}}
                ]
            }).select("_id")

            query.$or=[
                {orderId:{$regex: search, $options:"i"}},
                {userId:{$in:users.map(u=>u._id)}}
            ]
        }

        if(status){
            query.orderStatus= status
        }

        let sortOption={createdAt:-1}
        if(sort==="oldest")sortOption={createdAt:1}
        if(sort==="amount")sortOption={"priceDetails.total":-1}


        const totalOrders=await Order.countDocuments(query)

        const totalPages= Math.ceil(totalOrders/limit)
        const orders= await Order.find(query)
        .populate("userId","name email")
        .sort(sortOption)
        .skip(skip)
        .limit(limit)


        res.render("admin/orders",{
            orders,
            currentPage:Number(page),
            totalPages,
            search,
            status,
            sort
        })
    } catch (error) {
        
        console.error("Admin order list eror : ",error.message)
        res.status(500).send("Server Error")
        
    }
}



export const loadAdminOrderDetail=async(req,res)=>{
    try {
        const order= await Order.findOne({orderId:req.params.id})
        .populate("userId","name email")

        if(!order) return res.redirect("/admin/orders")

            res.render("admin/order-details",{order})

    } catch (error) {
        console.error("Admin order detail error: ",error.message)
        res.status(500).send("Server Error")
        
    }
}


export const updateOrderStatus= async(req,res)=>{
    try {
        const {status}=req.body

        await Order.updateOne(
            {orderId:req.params.id},
            {orderStatus:status}
        )

        res.redirect(`/admin/orders/${req.params.id}`)

    } catch (error) {
        
        console.error("Update order status error : ",error.message)
        res.status(500).send("Server Error")
        
    }
}