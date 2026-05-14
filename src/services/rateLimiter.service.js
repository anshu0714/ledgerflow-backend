const { redisClient } = require("../config/redis");
const logger = require("../utils/logger.utils");

async function isRateLimited(key, limit, windowSec) {
  try {
    const count = await redisClient.incr(key);

    if (count === 1) {
      await redisClient.expire(key, windowSec);
    }

    return count > limit;
  } catch (err) {
    logger.error("Redis rate limiter failed", {
      key,
      error: err.message,
    });

    return false;
  }
}

module.exports = {
  isRateLimited,
};
