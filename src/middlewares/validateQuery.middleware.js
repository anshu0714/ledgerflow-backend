const { error } = require("../utils/apiResponse.utils");

const validateQuery = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.query);

  if (!result.success) {
    return error(
      res,
      "Query validation failed",
      422,
      result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    );
  }

  req.query = result.data;
  next();
};

module.exports = validateQuery;
