const mongoose = require("mongoose");

const ledgerSchema = new mongoose.Schema(
  {
    transaction: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      required: true,
      index: true,
      immutable: true,
    },
    account: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Account",
      required: [true, "An account must be associated for a ledger entry"],
      index: true,
      immutable: true,
    },
    amount: {
      type: Number,
      required: [true, "A amount is required to create a ledger"],
      immutable: true,
    },
    transactionType: {
      type: String,
      enum: {
        values: ["DEBIT", "CREDIT"],
        message: "Transaction type can either be DEBIT or CREDIT",
      },
      required: [true, "Transaction type is required"],
      immutable: true,
    },
  },
  { timestamps: true },
);

function preventLedgerModification() {
  throw new Error("Ledger entry can't be modified or delete");
}

ledgerSchema.pre("findOneAndDelete", preventLedgerModification);
ledgerSchema.pre("findOneAndReplace", preventLedgerModification);
ledgerSchema.pre("findOneAndUpdate", preventLedgerModification);
ledgerSchema.pre("updateOne", preventLedgerModification);
ledgerSchema.pre("replaceOne", preventLedgerModification);
ledgerSchema.pre("deleteOne", preventLedgerModification);
ledgerSchema.pre("updateMany", preventLedgerModification);
ledgerSchema.pre("deleteMany", preventLedgerModification);

ledgerSchema.index({ account: 1, transactionType: 1 });

const Ledger = mongoose.model("Ledger", ledgerSchema);

module.exports = Ledger;
