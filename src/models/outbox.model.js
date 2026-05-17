const mongoose = require("mongoose");

const outboxSchema = new mongoose.Schema(
  {
    eventName: {
      type: String,
      enum: ["TRANSACTION_SUCCESS", "REGISTRATION_SUCCESS"],
      required: true,
    },

    payload: {
      type: mongoose.Schema.Types.Mixed,
      required: true,
    },

    status: {
      type: String,
      enum: ["PENDING", "PROCESSED", "FAILED", "DEAD_LETTER"],
      default: "PENDING",
      required: true,
      index: true,
    },

    retryCount: {
      type: Number,
      default: 0,
    },

    processedAt: {
      type: Date,
    },

    lastError: {
      type: String,
    },
  },
  { timestamps: true },
);

outboxSchema.index({ status: 1, retryCount: 1 });

const Outbox = mongoose.model("Outbox", outboxSchema);

module.exports = Outbox;
