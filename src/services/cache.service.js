const { redisClient } = require("../config/redis");
const logger = require("../utils/logger.utils");

async function getCache(key) {
  try {
    if (!redisClient.isOpen) {
      return null;
    }

    const value = await redisClient.get(key);

    return value ? JSON.parse(value) : null;
  } catch (err) {
    logger.error("Redis cache get failed", {
      key,
      error: err.message,
    });

    return null;
  }
}

async function setCache(key, value, ttl = 60) {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.setEx(key, ttl, JSON.stringify(value));
  } catch (err) {
    logger.error("Redis cache set failed", {
      key,
      error: err.message,
    });
  }
}

async function deleteCache(key) {
  try {
    if (!redisClient.isOpen) {
      return;
    }

    await redisClient.del(key);
  } catch (err) {
    logger.error("Redis cache delete failed", {
      key,
      error: err.message,
    });
  }
}

module.exports = {
  getCache,
  setCache,
  deleteCache,
};
