const { isRateLimited } = require("../utils/rateLimiter.utils");

function globalRateLimiter(req, res, next) {
  const LIMIT = 100;
  const WINDOW_MS = 60 * 1000;

  const key = `global:${req.ip}`;

  res.setHeader("X-RateLimit-Limit", LIMIT);

  const limited = isRateLimited(key, LIMIT, WINDOW_MS);

  if (limited) {
    res.setHeader("X-RateLimit-Remaining", 0);
    res.setHeader("Retry-After", 60);

    return res.status(429).json({
      error: "Rate limit exceeded",
      message: "Too many requests from this IP",
      limit: LIMIT,
      window: "60 seconds",
      retryAfter: 60,
    });
  }

  next();
}

module.exports = globalRateLimiter;
