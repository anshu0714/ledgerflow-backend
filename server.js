require("dotenv").config();

const app = require("./src/app");
const connectDB = require("./src/config/db");
const { connectRedis } = require("./src/config/redis");
const setupSwagger = require("./swagger");
const startOutboxWorker = require("./src/workers/startOutbox.worker");
const logger = require("./src/utils/logger.utils");

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();

    const redisConnected = await connectRedis();

    if (!redisConnected) {
      logger.warn("Application started without Redis support");
    }

    setupSwagger(app);

    const server = app.listen(PORT, () => {
      logger.info("Server started", { port: PORT });
    });

    startOutboxWorker();

    setInterval(() => {
      logger.info("System health", {
        memoryMB: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      });
    }, 15000);

    return server;
  } catch (error) {
    logger.error("Server startup failed", {
      error: error.message,
      stack: error.stack,
    });

    process.exit(1);
  }
};

startServer();
