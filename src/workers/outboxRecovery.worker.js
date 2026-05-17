const Outbox = require("../models/outbox.model");
const getOutboxQueue = require("../queues/outbox.queue");
const logger = require("../utils/logger.utils");

async function recoverOutboxJobs() {
  try {
    const pendingEvents = await Outbox.find({
      status: "PENDING",
    }).limit(50);

    const outboxQueue = getOutboxQueue();

    if (!outboxQueue) {
      logger.warn("Queue unavailable");
      return;
    }

    for (const event of pendingEvents) {
      const existingJob = await outboxQueue.getJob(event._id.toString());

      if (!existingJob) {
        await outboxQueue.add(
          "recovery-job",
          {
            outboxId: event._id.toString(),
          },
          {
            jobId: event._id.toString(),
          },
        );

        logger.info("Recovered missing queue job", {
          outboxId: event._id,
        });
      }
    }
  } catch (err) {
    logger.error("Outbox recovery failed", {
      error: err.message,
    });
  }
}

module.exports = recoverOutboxJobs;
