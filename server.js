require("dotenv").config();
const app = require("./src/app");
const connectDB = require("./src/config/db");
const setupSwagger = require("./swagger");
const startOutboxWorker = require("./src/workers/startOutbox.worker");
const PORT = process.env.PORT || 3000;

const startServer = async () => {
  try {
    await connectDB();
    setupSwagger(app);
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}!`);
    });
    startOutboxWorker();
  } catch (error) {
    console.log("Failed to start server: ", error);
    process.exit(1);
  }
};

startServer();
