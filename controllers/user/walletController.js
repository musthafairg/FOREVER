import User from "../../models/userModel.js";

export const loadWallet = async (req, res) => {
  try {
    const userId = req.session.user._id;
    const user = await User.findById(userId);
    res.render("user/wallet", { user });
  } catch (error) {
    console.error("Load Wallet Error :", error.message);
    res.status(500).render("errors/500");
  }
};
