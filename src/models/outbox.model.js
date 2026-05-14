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

    nextRetryAt: {
      type: Date,
      index: true,
    },

    processedAt: {
      type: Date,
    },

    lockedAt: {
      type: Date,
    },

    lastError: {
      type: String,
    },
  },
  { timestamps: true },
);

outboxSchema.index({ status: 1, nextRetryAt: 1, lockedAt: 1 });

const Outbox = mongoose.model("Outbox", outboxSchema);

module.exports = Outbox;
