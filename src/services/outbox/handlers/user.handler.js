const emailService = require("../../mail.service");
const logger = require("../../../utils/logger");

async function userHandler(payload) {
  const { userEmail, userName } = payload;

  try {
    await emailService.sendUserRegistrationEmail(userName, userEmail);
  } catch (err) {
    logger.error("User registration email failed", {
      userEmail,
      error: err.message,
    });
    throw err;
  }
}

module.exports = userHandler;
