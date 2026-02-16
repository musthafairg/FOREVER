import User from "../../models/userModel.js";
import Address from "../../models/addressModel.js";
import { success } from "zod";

export const loadAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    const addressData = await Address.findOne({ userId });

    res.render("user/address", { user, addressData });
  } catch (error) {
    console.error("Error in load Address page", error.message);
    res.status(500).render("errors/500");
  }
};

export const loadAddAddressPage = async (req, res) => {
  try {
    const userId = req.session.user._id;

    const user = await User.findById(userId);

    res.render("user/add-address", {
      user,
      errors: {},
      FormData: {},
    });
  } catch (error) {
    console.error("Error in load Add Address page", error.message);
    res.status(500).render("errors/500");
  }
};

export const addAddress = async (req, res) => {
  try {
    if (!req.session.user._id) {
      return res.redirect("/login");
    }

    const userId = req.session.user._id;

    const {
      addressType,
      name,
      houseName,
      place,
      city,
      district,
      state,
      pincode,
      phone,
      altPhone,
    } = req.body;

    let userAddress = await Address.findOne({ userId });

    const newAddress = {
      addressType,
      name,
      houseName,
      place,
      city,
      district,
      state,
      pincode,
      phone,
      altPhone,
    };

    if (!userAddress) {
      userAddress = new Address({
        userId,
        address: [newAddress],
      });
    } else {
      userAddress.address.push(newAddress);
    }

    await userAddress.save();

    return res.json({
      success: true,
      message: "Address added successfully",
    });
  } catch (error) {
    console.error("Add Address Error", error.message);
    res
      .status(500)
      .json({
        success: false,
        message: "Server error",
      })
      .render("errors/500");
  }
};

export const loadEditAddress = async (req, res) => {
  try {
    const { index } = req.params;
    const userId = req.session.user._id;
    const user = await User.findById(userId);

    const addressData = await Address.findOne({ userId });

    if (!addressData || !addressData.address[index]) {
      return res.redirect("/address");
    }

    res.render("user/edit-address", {
      user,
      address: addressData.address[index],
      index,
    });
  } catch (error) {
    console.error("Load Edit Address Error :", error.message);
    res.status(500).render("errors/500");
  }
};

export const updateAddress = async (req, res) => {
  try {
    const { index } = req.params;
    const userId = req.session.user._id;

    const addressData = await Address.findOne({ userId });

    if (!addressData || !addressData.address[index]) {
      return res.status(404).json({ success: false });
    }

    addressData.address[index] = {
      ...addressData.address[index]._doc,
      ...req.body,
    };

    await addressData.save();

    res.json({ success: true });
  } catch (error) {
    console.error("Update Address Error :", error.message);
    res.status(500).json({ success: false }).render("errors/500");
  }
};

export const deleteAddress = async (req, res) => {
  try {
    const { index } = req.params;
    const userId = req.session.user._id;

    const addressData = await Address.findOne({ userId });

    if (!addressData || !addressData.address[index]) {
      return res.redirect("/address");
    }

    addressData.address.splice(index, 1);

    await addressData.save();

    res.redirect("/address");
  } catch (error) {
    console.error("Delete Address Error : ", error.message);
    res.status(500).render("errors/500");
  }
};

export const setDefaultAddress = async (req, res) => {
  try {
    const { index } = req.params;

    const userId = req.session.user._id;

    const addressData = await Address.findOne({ userId });

    if (!addressData || !addressData.address[index]) {
      return res.redirect("/address");
    }

    addressData.address.forEach((addr) => {
      addr.isDefault = false;
    });

    addressData.address[index].isDefault = true;

    await addressData.save();

    res.redirect("/address");
  } catch (error) {
    console.error("Set Defualt Address Error :", error.message);
    res.status(500).render("errors/500");
  }
};
