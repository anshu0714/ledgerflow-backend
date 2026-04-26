const { z } = require("zod");
const { objectId } = require("./common.validator");

const createTransactionSchema = z.object({
  fromAccount: objectId,
  toAccount: objectId,

  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),

  idempotencyKey: z
    .string({ required_error: "Idempotency key is required" })
    .min(10, "Idempotency key must be at least 10 characters")
    .max(100, "Idempotency key too long"),
});

const initialFundSchema = z.object({
  toAccount: objectId,

  amount: z
    .number({ required_error: "Amount is required" })
    .positive("Amount must be greater than 0"),

  idempotencyKey: z
    .string({ required_error: "Idempotency key is required" })
    .min(10, "Idempotency key must be at least 10 characters"),
});

module.exports = {
  createTransactionSchema,
  initialFundSchema,
};
