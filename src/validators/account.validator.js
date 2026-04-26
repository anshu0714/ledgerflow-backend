const { z } = require("zod");

const createAccountSchema = z.object({
  currency: z.enum(["INR", "USD", "EUR"], {
    errorMap: () => ({
      message: "Currency must be one of INR, USD, or EUR",
    }),
  }),
});

module.exports = { createAccountSchema };
