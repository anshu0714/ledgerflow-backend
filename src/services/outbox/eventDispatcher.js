const transactionHandler = require("./handlers/transaction.handler");
const userHandler = require("./handlers/user.handler");

async function handleEvent(event) {
  switch (event.eventName) {
    case "TRANSACTION_SUCCESS":
      return transactionHandler(event.payload);

    case "REGISTRATION_SUCCESS":
      return userHandler(event.payload);

    default:
      throw new Error(`Unknown event type: ${event.eventName}`);
  }
}

module.exports = handleEvent;
