const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
  {
    fromAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Transaction must be associated with a from account"],
      index: true,
    },
    toAccount: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "Transaction must be associated with a to account"],
      index: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [0, "Amount must be greater than 0"],
    },
    status: {
      type: String,
      enum: {
        values: ["PENDING", "COMPLETED", "FAILED", "REVERSED"],
        message: "Status can be either PENDING, COMPLETED, FAILED, or REVERSED",
      },
      default: "PENDING",
    },
    referenceId: {
      type: String,
      required: true,
      unique: true,
      immutable: true,
      index: true,
    },
  },
  { timestamps: true },
);

transactionSchema.index({ fromAccount: 1, createdAt: -1 });
transactionSchema.index({ toAccount: 1, createdAt: -1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model("Transaction", transactionSchema);

module.exports = Transaction;
