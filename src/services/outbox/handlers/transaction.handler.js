const emailService = require("../../mail.service");
const logger = require("../../../utils/logger");

async function transactionHandler(payload) {
  const { userName, userEmail, fromAccount, toAccount, amount } = payload;

  try {
    await emailService.sendTransactionSuccessEmail(
      userName,
      userEmail,
      amount,
      fromAccount,
      toAccount,
    );
  } catch (err) {
    logger.error("Transaction email handler failed", {
      userEmail,
      fromAccount,
      toAccount,
      amount,
      error: err.message,
    });
    throw err;
  }
}

module.exports = transactionHandler;
