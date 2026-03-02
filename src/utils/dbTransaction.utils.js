const mongoose = require("mongoose");

async function runInTransaction(work) {
  const session = await mongoose.startSession();

  try {
    return await session.withTransaction(async () => {
      return await work(session);
    });
  } finally {
    await session.endSession();
  }
}

module.exports = runInTransaction;
