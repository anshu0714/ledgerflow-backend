const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      index: true,
      required: [true, "Account must be associated with a user!"],
    },
    isSystemAccount: {
      type: Boolean,
      default: false,
      index: true,
      immutable: true,
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
    balance: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
    optimisticConcurrency: true,
  },
);

accountSchema.index({ user: 1, status: 1 });
accountSchema.index({ user: 1, isSystemAccount: 1 });

const Account = mongoose.model("Account", accountSchema);

module.exports = Account;
