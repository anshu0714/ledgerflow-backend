const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { extractToken, isTokenBlacklisted } = require("../utils/token.utils");

async function authenticate(req, res, next) {
  let token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized user, token is Missing!",
    });
  }

  if (await isTokenBlacklisted(token)) {
    return res.status(401).json({ message: "Token is blacklisted" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);

    if (!user) {
      return res.status(401).json({
        message: "User doesn't exist!",
      });
    }
    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized user, token is invalid!",
    });
  }
}

async function systemUserAuthenticate(req, res, next) {
  let token = extractToken(req);

  if (!token) {
    return res.status(401).json({
      message: "Unauthorized user, token is Missing!",
    });
  }

  if (await isTokenBlacklisted(token)) {
    return res.status(401).json({ message: "Token is blacklisted" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+systemUser");

    if (!user) {
      return res.status(401).json({
        message: "User doesn't exist!",
      });
    }

    if (!user.systemUser) {
      return res.status(403).json({
        message: "Forbidden access, not a system user!",
      });
    }

    req.user = user;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Unauthorized user, token is invalid!",
    });
  }
}

module.exports = { authenticate, systemUserAuthenticate };
