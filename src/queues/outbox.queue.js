const { Queue } = require("bullmq");
const { redisConfig } = require("../config/redis");

let outboxQueue = null;

function getOutboxQueue() {
  if (!outboxQueue) {
    try {
      outboxQueue = new Queue("outbox-processing", {
        connection: redisConfig,

        defaultJobOptions: {
          attempts: 5,

          backoff: {
            type: "exponential",
            delay: 5000,
          },

          removeOnComplete: 100,

          removeOnFail: false,
        },
      });
    } catch (err) {
      return null;
    }
  }

  return outboxQueue;
}

module.exports = getOutboxQueue;
