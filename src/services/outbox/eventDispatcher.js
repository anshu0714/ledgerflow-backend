const transactionHandler = require("./handlers/transaction.handler");
const userHandler = require("./handlers/user.handler");
const logger = require("../../utils/logger.utils");

async function handleEvent(event) {
  try {
    switch (event.eventName) {
      case "TRANSACTION_SUCCESS":
        return await transactionHandler(event.payload);

      case "REGISTRATION_SUCCESS":
        return await userHandler(event.payload);

      default:
        logger.error("Unknown event type received", {
          eventName: event.eventName,
          eventId: event._id,
        });
        throw new Error(`Unknown event type: ${event.eventName}`);
    }
  } catch (err) {
    logger.error("Event processing failed", {
      eventName: event.eventName,
      eventId: event._id,
      error: err.message,
    });
    throw err;
  }
}

module.exports = handleEvent;
