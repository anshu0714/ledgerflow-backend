const Outbox = require("../models/outbox.model");
const handleEvent = require("../services/outbox/eventDispatcher");
const logger = require("../utils/logger");

async function processOutboxEvents() {
  while (true) {
    const event = await Outbox.findOneAndUpdate(
      {
        status: { $in: ["PENDING", "FAILED"] },

        $and: [
          {
            $or: [{ nextRetryAt: { $lte: new Date() } }, { nextRetryAt: null }],
          },
          {
            $or: [
              { lockedAt: null },
              {
                lockedAt: {
                  $lt: new Date(Date.now() - 60000),
                },
              },
            ],
          },
        ],
      },
      {
        $set: { lockedAt: new Date() },
      },
      { returnDocument: "after" },
    );

    if (!event) {
      break;
    }

    try {
      await handleEvent(event);

      logger.info("Outbox event processed", {
        eventId: event._id,
        eventName: event.eventName,
        retryCount: event.retryCount,
      });

      event.status = "PROCESSED";
      event.processedAt = new Date();
      event.lockedAt = null;

      await event.save();
    } catch (err) {
      event.retryCount += 1;
      event.lastError = err.message;

      const delay = Math.min(60000, Math.pow(2, event.retryCount) * 1000);

      event.nextRetryAt = new Date(Date.now() + delay);
      event.status = "FAILED";
      event.lockedAt = null;

      logger.error("Outbox event failed", {
        eventId: event._id,
        eventName: event.eventName,
        retryCount: event.retryCount,
        nextRetryAt: event.nextRetryAt,
        error: err.message,
      });

      await event.save();
    }
  }
}

module.exports = processOutboxEvents;
