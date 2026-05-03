const jwt = require("jsonwebtoken");
const User = require("../models/user.model");
const { extractToken, isTokenBlacklisted } = require("../utils/token.utils");
const { error } = require("../utils/apiResponse.utils");

async function authenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return error(res, "Unauthorized user, token is missing!", 401);
  }

  if (await isTokenBlacklisted(token)) {
    return error(res, "Token is blacklisted", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("_id email name");

    if (!user) {
      return error(res, "User doesn't exist!", 401);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, "Unauthorized user, token is invalid!", 401);
  }
}

async function systemUserAuthenticate(req, res, next) {
  const token = extractToken(req);

  if (!token) {
    return error(res, "Unauthorized user, token is missing!", 401);
  }

  if (await isTokenBlacklisted(token)) {
    return error(res, "Token is blacklisted", 401);
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    const user = await User.findById(decoded.id).select("+systemUser");

    if (!user) {
      return error(res, "User doesn't exist!", 401);
    }

    if (!user.systemUser) {
      return error(res, "Forbidden access, not a system user!", 403);
    }

    req.user = user;
    next();
  } catch (err) {
    return error(res, "Unauthorized user, token is invalid!", 401);
  }
}

module.exports = { authenticate, systemUserAuthenticate };
