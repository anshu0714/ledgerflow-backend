const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { extractToken, isTokenBlacklisted } = require("../utils/token.utils");
const { error } = require("../utils/apiResponse.utils");
const logger = require("../utils/logger");

async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    logger.warn("Auth failed - token missing", {
      requestId: req.requestId,
      ip: req.ip,
    });

    return error(res, "Unauthorized user, token is missing!", 401);
  }

  if (await isTokenBlacklisted(token)) {
    logger.warn("Auth failed - token blacklisted", {
      requestId: req.requestId,
      ip: req.ip,
    });

    return error(res, "Token is blacklisted", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id email name");

    if (!user) {
      logger.error("Auth failed - user not found", {
        requestId: req.requestId,
        userId: decoded.id,
      });

      return error(res, "User doesn't exist!", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.warn("Auth failed - invalid token", {
      requestId: req.requestId,
      error: err.message,
    });

    return error(res, "Unauthorized user, token is invalid!", 401);
  }
}

async function systemUserAuthenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    logger.error("System auth failed - token missing", {
      requestId: req.requestId,
      ip: req.ip,
    });

    return error(res, "Unauthorized user, token is missing!", 401);
  }

  if (await isTokenBlacklisted(token)) {
    logger.error("System auth failed - token blacklisted", {
      requestId: req.requestId,
      ip: req.ip,
    });

    return error(res, "Token is blacklisted", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+systemUser");

    if (!user) {
      logger.error("System auth failed - user not found", {
        requestId: req.requestId,
        userId: decoded.id,
      });

      return error(res, "User doesn't exist!", 401);
    }

    if (!user.systemUser) {
      logger.error("System auth failed - not system user", {
        requestId: req.requestId,
        userId: user._id,
      });

      return error(res, "Forbidden access, not a system user!", 403);
    }

    req.user = user;
    next();
  } catch (err) {
    logger.error("System auth failed - invalid token", {
      requestId: req.requestId,
      error: err.message,
    });

    return error(res, "Unauthorized user, token is invalid!", 401);
  }
}

module.exports = { authenticate, systemUserAuthenticate };
