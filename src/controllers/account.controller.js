const Account = require("../models/account.model");

async function createAccount(req, res) {
  try {
    const account = await Account.create({
      user: req.user._id,
      currency: req.body?.currency,
    });

    res.status(201).json({
      message: "Account created successfully!",
      account: account,
    });
  } catch (error) {
    console.log(error);
    if (error.name === "ValidationError") {
      return res.status(400).json({ message: error.message });
    }
    return res
      .status(500)
      .json({ message: "Something went wrong", error: error.message });
  }
}

async function getUserAccounts(req, res) {
  const accounts = await Account.find({ user: req.user._id });
  res.status(200).json({
    message: "All accounts fetched successfully!",
    accounts: accounts,
  });
}

async function getAccountBalance(req, res) {
  try {
    const { accountId } = req.params;

    const account = await Account.findOne({
      _id: accountId,
      user: req.user._id,
    });

    if (!account) {
      return res.status(404).json({
        message: "Account Not Found!",
      });
    }

    const balance = await account.getBalance();

    return res.status(200).json({
      message: "Account balance fetched successfully!",
      accountId: account._id,
      balance,
    });
  } catch (error) {
    return res.status(500).json({
      message: "Failed to fetch balance",
      error: error.message,
    });
  }
}

module.exports = { createAccount, getUserAccounts, getAccountBalance };
