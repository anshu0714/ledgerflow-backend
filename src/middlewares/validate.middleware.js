const { error } = require("../utils/apiResponse.utils");
const logger = require("../utils/logger.utils");

const validate = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body);

  if (!result.success) {
    logger.error("Validation failed", {
      requestId: req.requestId,
      path: req.originalUrl,
      issues: result.error.issues.map((err) => ({
        field: err.path.join("."),
        message: err.message,
      })),
    });

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
