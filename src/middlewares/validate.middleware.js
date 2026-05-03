const { error } = require("../utils/apiResponse.utils");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    return error(
      res,
      "Validation failed",
      422,
      result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    );
  }

  req.body = result.data;
  next();
};

module.exports = validate;
