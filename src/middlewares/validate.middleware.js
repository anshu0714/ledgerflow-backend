const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });
  }

  req.body = result.data;
  next();
};

module.exports = validate;
