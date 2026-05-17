const { createClient } = require("redis");
const logger = require("../utils/logger.utils");

const MAX_RETRIES = 5;

const redisConfig = {
  url: process.env.REDIS_URL,

  socket: {
    reconnectStrategy: false,
    connectTimeout: 5000,
  },
};

const redisClient = createClient(redisConfig);

redisClient.on("error", (err) => {
  logger.error("Redis error", {
    error: err.message || "Unknown Redis error",
  });
});

redisClient.on("connect", () => {
  logger.info("Redis connected");
});

async function connectRedis() {
  for (let retry = 1; retry <= MAX_RETRIES; retry++) {
    try {
      await redisClient.connect();

      logger.info("Redis connection established");

      return true;
    } catch (err) {
      logger.error("Redis connection failed", {
        retry,
        maxRetries: MAX_RETRIES,
        error: err.message,
      });

      if (retry < MAX_RETRIES) {
        await new Promise((resolve) => setTimeout(resolve, 5000));
      }
    }
  }

  logger.warn("Redis unavailable - continuing without Redis");

  return false;
}

module.exports = {
  redisClient,
  redisConfig,
  connectRedis,
};
