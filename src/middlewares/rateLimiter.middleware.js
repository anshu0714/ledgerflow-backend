const { isRateLimited } = require("../services/rateLimiter.service");
const { error } = require("../utils/apiResponse.utils");
const logger = require("../utils/logger");

async function globalRateLimiter(req, res, next) {
  const LIMIT = 100;
  const WINDOW_SEC = 60;

  const ip = req.ip.replace(/^::ffff:/, "");
  const key = `global:${ip}`;

  res.setHeader("X-RateLimit-Limit", LIMIT);

  const limited = await isRateLimited(key, LIMIT, WINDOW_SEC);

  if (limited) {
    logger.warn("Global rate limit exceeded", {
      requestId: req.requestId,
      ip: req.ip,
      path: req.originalUrl,
      method: req.method,
    });

    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("Retry-After", 60);

    return error(res, "Too many requests from this IP", 429, {
      limit: LIMIT,
      window: "60 seconds",
      retryAfter: 60,
    });
  }

  next();
}

module.exports = globalRateLimiter;
