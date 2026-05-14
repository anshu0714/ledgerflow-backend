const mongoose = require("mongoose");
const logger = require("./logger.utils");

async function runInTransaction(work) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      return await work(session);
    });
  } catch (err) {
    logger.error("Database transaction failed", {
      error: err.message,
      stack: err.stack,
    });
    throw err;
  } finally {
    await session.endSession();
  }
}

module.exports = runInTransaction;
