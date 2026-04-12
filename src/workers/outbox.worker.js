const Outbox = require("../models/outbox.model");
const handleEvent = require("../services/outbox/eventDispatcher");
async function processOutboxEvents() {
  while (true) {
    const event = await Outbox.findOneAndUpdate(
      {
        status: { $in: ["PENDING", "FAILED"] },
        $or: [{ nextRetryAt: { $lte: new Date() } }, { nextRetryAt: null }],
        lockedAt: null,
      },
      {
        $set: { lockedAt: new Date() },
      },
      { new: true },
    );

    if (!event) {
      break;
    }

    try {
      await handleEvent(event);

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

      await event.save();
    }
  }
}

module.exports = processOutboxEvents;
