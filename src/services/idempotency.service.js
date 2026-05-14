const mongoose = require("mongoose");
const IdempotencyKey = require("../models/idempotencyKey.model");
const hashRequest = require("../utils/hash.utils");
const logger = require("../utils/logger.utils");

async function handleIdempotentRequest({ idempotencyKey, payload, handler }) {
  const requestHash = hashRequest(payload);
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      let existing = await IdempotencyKey.findOne(
        { key: idempotencyKey },
        null,
        { session },
      );

      if (existing) {
        if (existing.requestHash !== requestHash) {
          return {
            type: "ERROR",
            status: 400,
            message: "Key reused with different payload",
          };
        }

        if (existing.status === "SUCCESS") {
          return {
            type: "SUCCESS",
            data: existing.response,
            isReplay: true,
          };
        }

        if (existing.status === "PROCESSING") {
          return {
            type: "ERROR",
            status: 409,
            message: "Still processing",
          };
        }

        if (existing.status === "FAILED") {
          return {
            type: "ERROR",
            status: 409,
            message: "Previous attempt failed",
          };
        }
      }

      try {
        await IdempotencyKey.create(
          [
            {
              key: idempotencyKey,
              requestHash,
              status: "PROCESSING",
            },
          ],
          { session },
        );
      } catch (err) {
        if (err.code === 11000) {
          const existing = await IdempotencyKey.findOne(
            { key: idempotencyKey },
            null,
            { session },
          );

          if (!existing) throw err;

          if (existing.requestHash !== requestHash) {
            return {
              type: "ERROR",
              status: 400,
              message: "Key reused with different payload",
            };
          }

          if (existing.status === "SUCCESS") {
            return {
              type: "SUCCESS",
              data: existing.response,
              isReplay: true,
            };
          }

          return {
            type: "ERROR",
            status: 409,
            message: "Still processing",
          };
        }

        throw err;
      }

      const result = await handler(session);

      if (!result || !result._id) {
        throw new Error("Invalid transaction result");
      }

      await IdempotencyKey.updateOne(
        { key: idempotencyKey },
        {
          $set: {
            status: "SUCCESS",
            response: result,
            resourceId: result._id,
          },
        },
        { session },
      );

      return { type: "SUCCESS", data: result, isReplay: false };
    });
  } catch (error) {
    logger.error("Idempotency transaction failed", {
      key: idempotencyKey,
      error: error.message,
      stack: error.stack,
    });

    const res = await IdempotencyKey.updateOne(
      { key: idempotencyKey },
      { $set: { status: "FAILED" } },
    );

    if (res.matchedCount === 0) {
      logger.warn("Idempotency record not found during failure update", {
        key: idempotencyKey,
      });
    }

    if (error.message === "Insufficient funds") {
      return {
        type: "ERROR",
        status: 400,
        message: error.message,
      };
    }

    return {
      type: "ERROR",
      status: 500,
      message: "Internal server error",
    };
  } finally {
    session.endSession();
  }
}

module.exports = handleIdempotentRequest;
