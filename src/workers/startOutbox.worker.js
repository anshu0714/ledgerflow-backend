const processOutboxEvents = require("./outbox.worker");
const logger = require("../utils/logger");
const { randomUUID } = require("crypto");

function startOutboxWorker() {
  setInterval(async () => {
    const jobId = randomUUID();
    const start = Date.now();

    try {
      await processOutboxEvents();

      logger.info("Outbox job processed", {
        jobId,
        duration: Date.now() - start,
      });
    } catch (err) {
      logger.error("Outbox job failed", {
        jobId,
        duration: Date.now() - start,
        error: err.message,
        stack: err.stack,
      });
    }
  }, 15000);
}

module.exports = startOutboxWorker;
