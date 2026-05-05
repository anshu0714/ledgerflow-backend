const emailService = require("../../mail.service");
const logger = require("../../../utils/logger");

async function transactionHandler(payload) {
  const { userName, userEmail, fromAccount, toAccount, amount } = payload;

  try {
    const result = await emailService.sendTransactionSuccessEmail(
      userName,
      userEmail,
      amount,
      fromAccount,
      toAccount,
    );

    if (!result || !result.messageId) {
      throw new Error("Email not confirmed");
    }

    return result;
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
