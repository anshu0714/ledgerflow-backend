const processOutboxEvents = require("./outbox.worker");

function startOutboxWorker() {
  console.log("🚀 Outbox worker started...");

  setInterval(async () => {
    try {
      await processOutboxEvents();
    } catch (err) {
      console.error("❌ Worker error:", err.message);
    }
  }, 15000);
}

module.exports = startOutboxWorker;
