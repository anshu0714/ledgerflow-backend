const IdempotencyKey = require("../models/idempotencyKey.model");
const Transaction = require("../models/transaction.model");
const hashRequest = require("../utils/hash.utils");
const logger = require("../utils/logger");

async function handleIdempotentRequest({ idempotencyKey, payload, handler }) {
  const requestHash = hashRequest(payload);

  try {
    const record = await IdempotencyKey.create({
      key: idempotencyKey,
      requestHash,
      status: "PROCESSING",
    });

    const result = await handler();

    if (!result || !result._id) {
      throw new Error("Invalid transaction result");
    }

    record.resourceId = result._id;
    record.status = "SUCCESS";
    record.response = result;
    await record.save();

    return { type: "SUCCESS", data: result, isReplay: false };
  } catch (error) {
    if (error.code === 11000) {
      logger.info("Idempotency replay detected", {
        key: idempotencyKey,
      });

      const existing = await IdempotencyKey.findOne({
        key: idempotencyKey,
      });

      if (!existing) {
        logger.error("Idempotency record missing after duplicate", {
          key: idempotencyKey,
        });

        return { type: "ERROR", status: 404, message: "Not found" };
      }

      if (existing.requestHash !== requestHash) {
        logger.error("Idempotency key reused with different payload", {
          key: idempotencyKey,
        });

        return {
          type: "ERROR",
          status: 400,
          message: "Key reused with different payload",
        };
      }

      if (existing.status === "SUCCESS") {
        return { type: "SUCCESS", data: existing.response, isReplay: true };
      }

      if (existing.status === "PROCESSING") {
        logger.info("Idempotency still processing", {
          key: idempotencyKey,
        });

        if (existing.resourceId) {
          const transaction = await Transaction.findById(
            existing.resourceId,
          ).lean();

          if (transaction && transaction.status === "COMPLETED") {
            return {
              type: "SUCCESS",
              data: transaction,
              isReplay: true,
            };
          }
        }

        return {
          type: "ERROR",
          status: 409,
          message: "Still processing",
        };
      }

      if (existing.status === "FAILED") {
        logger.error("Idempotency previous attempt failed", {
          key: idempotencyKey,
        });

        return {
          type: "ERROR",
          status: 409,
          message: "Previous attempt failed",
        };
      }
    }

    logger.error("Idempotency handler failed", {
      key: idempotencyKey,
      error: error.message,
    });

    await IdempotencyKey.findOneAndUpdate(
      { key: idempotencyKey, status: "PROCESSING" },
      { status: "FAILED" },
    );

    return {
      type: "ERROR",
      status: 500,
      message: "Internal server error",
    };
  }
}

module.exports = handleIdempotentRequest;
