const { z } = require("zod");
const { objectId } = require("./common.validator");

const historyQuerySchema = z.object({
  accountId: objectId,

  cursor: z
    .string()
    .optional()
    .refine((val) => !val || !isNaN(Date.parse(val)), {
      message: "Invalid cursor date",
    }),

  limit: z
    .string()
    .optional()
    .transform((val) => (val ? parseInt(val, 10) : 10))
    .refine((val) => val >= 1 && val <= 50, {
      message: "Limit must be between 1 and 50",
    }),
});

module.exports = { historyQuerySchema };
