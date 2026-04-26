const { z } = require("zod");

const objectId = z
  .string({ required_error: "ID is required" })
  .regex(/^[0-9a-fA-F]{24}$/, "Invalid ID format");

module.exports = { objectId };
