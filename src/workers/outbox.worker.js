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
      console.log("No events to process");
      break;
    }

    console.log(`Processing event: ${event._id}`);

    try {
      await handleEvent(event);

      event.status = "PROCESSED";
      event.processedAt = new Date();
      event.lockedAt = null;

      await event.save();

      console.log(`Event processed: ${event._id}`);
    } catch (err) {
      console.log(`Event failed: ${event._id}`);

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
