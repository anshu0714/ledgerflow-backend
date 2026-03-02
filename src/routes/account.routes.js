const express = require("express");
const accountController = require("../controllers/account.controller");
const authMiddleware = require("../middlewares/auth.middleware");

const router = express.Router();

router.post("/", authMiddleware.authenticate, accountController.createAccount);
router.get("/", authMiddleware.authenticate, accountController.getUserAccounts);
router.get(
  "/balance/:accountId",
  authMiddleware.authenticate,
  accountController.getAccountBalance,
);

module.exports = router;
