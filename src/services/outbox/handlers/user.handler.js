const emailService = require("../../mail.service");

async function userHandler(payload) {
  const { userEmail, userName } = payload;

  await emailService.sendUserRegistrationEmail(userName, userEmail);
}

module.exports = userHandler;
