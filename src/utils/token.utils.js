const TokenBlacklist = require("../models/tokenBlacklist.model");
const jwt = require("jsonwebtoken")

function extractToken(req) {
  if (req.cookies?.token) return req.cookies.token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer ")
  ) {
    return req.headers.authorization.split(" ")[1];
  }

  return null;
}

function generateToken(userId) {
  const token = jwt.sign({ id: userId }, process.env.JWT_SECRET, {
    expiresIn: "3d",
  });
  return token;
}

function setTokenCookie(res, token) {
  res.cookie("token", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
}

async function isTokenBlacklisted(token) {
  const blacklisted = await TokenBlacklist.exists({ token });
  return !!blacklisted;
}

module.exports = {
  extractToken,
  generateToken,
  setTokenCookie,
  isTokenBlacklisted,
};
