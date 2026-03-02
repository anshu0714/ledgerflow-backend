const Account = require("../models/account.model");
const Transaction = require("../models/transaction.model");
const Ledger = require("../models/ledger.model");
const runInTransaction = require("../utils/dbTransaction.utils");

async function processTransfer({
  fromAccount,
  toAccount,
  amount,
  idempotencyKey,
}) {
  return await runInTransaction(async (session) => {
    const fromUser = await Account.findById(fromAccount).session(session);
    const toUser = await Account.findById(toAccount).session(session);

    if (!fromUser || !toUser) {
      throw new Error("Account not found");
    }

    if (fromUser.status !== "ACTIVE" || toUser.status !== "ACTIVE") {
      throw new Error("Account not active");
    }

    if (amount <= 0) {
      throw new Error("Amount must be greater than zero");
    }

    // Derive balance
    const balance = await fromUser.getBalance({ session });

    if (balance < amount) {
      throw new Error("Insufficient funds");
    }

    // Create transaction
    const [transaction] = await Transaction.create(
      [
        {
          fromAccount,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    );

    // Create ledger entries
    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: fromAccount,
          amount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: toAccount,
          amount,
          transactionType: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    return transaction;
  });
}

async function processInitialFunding({
  systemAccountId,
  toAccount,
  amount,
  idempotencyKey,
}) {
  return await runInTransaction(async (session) => {
    const systemAccount =
      await Account.findById(systemAccountId).session(session);
    const receiver = await Account.findById(toAccount).session(session);

    if (!systemAccount || !receiver) {
      throw new Error("Account not found");
    }

    if (receiver.status !== "ACTIVE") {
      throw new Error("Receiver account not active");
    }

    const [transaction] = await Transaction.create(
      [
        {
          fromAccount: systemAccount._id,
          toAccount,
          amount,
          idempotencyKey,
          status: "PENDING",
        },
      ],
      { session },
    );

    await Ledger.insertMany(
      [
        {
          transaction: transaction._id,
          account: systemAccount._id,
          amount,
          transactionType: "DEBIT",
        },
        {
          transaction: transaction._id,
          account: receiver._id,
          amount,
          transactionType: "CREDIT",
        },
      ],
      { session },
    );

    transaction.status = "COMPLETED";
    await transaction.save({ session });

    return transaction;
  });
}

module.exports = {
  processTransfer,
  processInitialFunding,
};
