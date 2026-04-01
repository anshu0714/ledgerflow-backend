const IdempotencyKey = require("../models/idempotencyKey.model");
const hashRequest = require("../utils/hash.utils");

async function handleIdempotentRequest({ idempotencyKey, payload, handler }) {
  const requestHash = hashRequest(payload);

  try {
    const record = await IdempotencyKey.create({
      key: idempotencyKey,
      requestHash,
      status: "PROCESSING",
    });

    const result = await handler();

    record.status = "SUCCESS";
    record.response = result;
    await record.save();

    return { type: "SUCCESS", data: result, isReplay: false };
  } catch (error) {
    if (error.code === 11000) {
      const existing = await IdempotencyKey.findOne({
        key: idempotencyKey,
      });

      if (!existing) {
        return { type: "ERROR", status: 404, message: "Not found" };
      }

      if (existing.requestHash !== requestHash) {
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

    await IdempotencyKey.findOneAndUpdate(
      { key: idempotencyKey, status: "PROCESSING" },
      { status: "FAILED" },
    );

    return {
      type: "ERROR",
      status: 500,
      message: error.message,
    };
  }
}

module.exports = handleIdempotentRequest;
