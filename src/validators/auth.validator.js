const { z } = require("zod");

const registerSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email cannot be empty")
    .email("Invalid email format"),

  name: z
    .string({ required_error: "Name is required" })
    .min(2, "Name must be at least 2 characters")
    .max(50, "Name cannot exceed 50 characters"),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters")
    .max(100, "Password too long"),
});

const loginSchema = z.object({
  email: z
    .string({ required_error: "Email is required" })
    .min(1, "Email cannot be empty")
    .email("Invalid email format"),

  password: z
    .string({ required_error: "Password is required" })
    .min(6, "Password must be at least 6 characters"),
});

module.exports = { registerSchema, loginSchema };
