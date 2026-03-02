const mongoose = require("mongoose");
const Ledger = require("./ledger.model");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: [true, "Account must be associated with a user!"],
    },
    status: {
      type: String,
      enum: {
        values: ["ACTIVE", "FROZEN", "CLOSED"],
        message: "Status can be either ACTIVE, FROZEN, or CLOSED!",
      },
      default: "ACTIVE",
    },
    currency: {
      type: String,
      enum: {
        values: ["INR", "USD", "EUR"],
        message: "Currency can be either INR, USD or EUR",
      },
      default: "INR",
      required: [true, "Currency is required for creating an account!"],
    },
  },
  {
    timestamps: true,
  },
);

accountSchema.index({ user: 1, status: 1 });

accountSchema.methods.getBalance = async function (options = {}) {
  const { session } = options;
  const balanceData = await Ledger.aggregate([
    { $match: { account: this._id } },
    {
      $group: {
        _id: "$account",
        totalDebit: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "DEBIT"] }, "$amount", 0],
          },
        },
        totalCredit: {
          $sum: {
            $cond: [{ $eq: ["$transactionType", "CREDIT"] }, "$amount", 0],
          },
        },
      },
    },
    {
      $project: {
        _id: 0,
        balance: { $subtract: ["$totalCredit", "$totalDebit"] },
      },
    },
  ]).session(session);

  if (balanceData.length === 0) {
    return 0;
  }

  return balanceData[0].balance;
};

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
