const emailService = require("../../mail.service");

async function transactionHandler(payload) {
  const { userName, userEmail, fromAccount, toAccount, amount } = payload;

  await emailService.transactionSuccessEmail(
    userName,
    userEmail,
    amount,
    fromAccount,
    toAccount,
  );
}

module.exports = transactionHandler;
