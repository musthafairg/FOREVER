import User from "../../models/userModel.js";

export const userInfo = async (req, res) => {
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

    const userData = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*", $options: "i" } },
        { email: { $regex: ".*" + search + ".*", $options: "i" } },
      ],
    })
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit)
      .exec();

    const count = await User.find({
      isAdmin: false,
      $or: [
        { name: { $regex: ".*" + search + ".*" } },
        { email: { $regex: ".*" + search + ".*" } },
      ],
    }).countDocuments();

    const totalPages = Math.ceil(count / limit);

    return res.render("admin/users", {
      page: "users",
      data: userData,
      totalPages: totalPages,
      currentPage: page,
      search,
    });
  } catch (error) {
    console.error("Error in userInfo Controll : ", error.message);
    return res.status(500).render("admin/errors/500", {
      page: "users",
     });
  }
};

export const blockCustomer = async (req, res) => {
  try {
    const id = req.query.id;
    await User.updateOne({ _id: id }, { $set: { isBlocked: true } });

    return res.redirect("/admin/users");
  } catch (error) {
    console.error("Error in blocking user in admin side: ", error.message);
    return res.status(500).render("admin/errors/500", {
      page: "users",
     });
  }
};

export const unblockCustomer = async (req, res) => {
  try {
    const id = req.query.id;

    await User.updateOne({ _id: id }, { $set: { isBlocked: false } });

    return res.redirect("/admin/users");
  } catch (error) {
    console.error("Error in unblocking user in admin side :", error.message);
    return res.status(500).render("admin/errors/500", {
      page: "users",
     });
  }
};
