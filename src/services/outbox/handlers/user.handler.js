const emailService = require("../../mail.service");

async function userHandler(payload) {
  const { userEmail, userName } = payload;

  await emailService.userRegistrationEmail(userName, userEmail);
}

module.exports = userHandler;
