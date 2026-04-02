const mongoose = require("mongoose");

const idempotencyKeySchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ["PROCESSING", "SUCCESS", "FAILED"],
      default: "PROCESSING",
    },
    response: {
      type: Object,
    },
    requestHash: {
      type: String,
      required: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Transaction",
      index: true,
    }
  },
  { timestamps: true },
);

const IdempotencyKey = mongoose.model("IdempotencyKey", idempotencyKeySchema);

module.exports = IdempotencyKey;
