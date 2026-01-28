import User from "../models/userModel.js";

export const creditWallet = async (userId, amount, reason) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { "wallet.balance": amount },
    $push: {
      "wallet.transactions": {
        amount,
        type: "CREDIT",
        reason,
      },
    },
  });
};

export const debitWallet = async (userId, amount, reason) => {
  await User.findByIdAndUpdate(userId, {
    $inc: { "wallet.balance": -amount },
    $push: {
      "wallet.transactions": {
        amount,
        type: "DEBIT",
        reason,
      },
    },
  });
};
