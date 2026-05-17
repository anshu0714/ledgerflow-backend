const { Worker } = require("bullmq");

const Outbox = require("../models/outbox.model");
const handleEvent = require("../services/outbox/eventDispatcher");

const logger = require("../utils/logger.utils");

const { redisConfig } = require("../config/redis");

const worker = new Worker(
  "outbox-processing",

  async (job) => {
    const { outboxId } = job.data;

    const event = await Outbox.findById(outboxId);

    if (!event) {
      throw new Error("Outbox event not found");
    }

    if (event.status === "PROCESSED") {
      return;
    }

    if (event.status === "DEAD_LETTER") {
      return;
    }

    logger.info("Queue job started", {
      jobId: job.id,
      outboxId,
      eventName: event.eventName,
    });

    try {
      await handleEvent(event);

      event.status = "PROCESSED";
      event.processedAt = new Date();

      await event.save();

      logger.info("Queue event processed", {
        jobId: job.id,
        outboxId,
        eventName: event.eventName,
      });
    } catch (err) {
      event.retryCount += 1;

      event.lastError = err.message;

      if (event.retryCount >= 5) {
        event.status = "DEAD_LETTER";

        logger.error("Outbox moved to dead letter", {
          outboxId,
          retryCount: event.retryCount,
          error: err.message,
        });
      } else {
        event.status = "FAILED";
      }

      await event.save();

      logger.error("Queue event processing failed", {
        jobId: job.id,
        outboxId,
        retryCount: event.retryCount,
        error: err.message,
      });

      throw err;
    }
  },

  {
    connection: redisConfig,

    concurrency: 5,
  },
);

worker.on("active", (job) => {
  logger.info("BullMQ job active", {
    jobId: job.id,
  });
});

worker.on("completed", (job) => {
  logger.info("BullMQ job completed", {
    jobId: job.id,
  });
});

worker.on("failed", (job, err) => {
  logger.error("BullMQ job failed", {
    jobId: job?.id,
    error: err.message,
  });
});

module.exports = worker;
