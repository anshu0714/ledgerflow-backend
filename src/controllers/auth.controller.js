const User = require("../models/user.model");
const TokenBlacklist = require("../models/tokenBlacklist.model");
const jwt = require("jsonwebtoken");
const {
  extractToken,
  setTokenCookie,
  generateToken,
} = require("../utils/token.utils");
const Outbox = require("../models/outbox.model");
const runInTransaction = require("../utils/dbTransaction.utils");
const { isRateLimited } = require("../utils/rateLimiter.utils");

async function userRegisterController(req, res) {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const key = `register:${req.ip}`;

    if (isRateLimited(key, 3, 60 * 1000)) {
      return res.status(429).json({
        message: "Too many registrations. Try later.",
      });
    }

    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return res.status(409).json({
        message: "User already exist with this email!",
      });
    }

    let user;

    await runInTransaction(async (session) => {
      const [createdUser] = await User.create([{ email, name, password }], {
        session,
      });

      user = createdUser;

      const result = await Outbox.create(
        [
          {
            eventName: "REGISTRATION_SUCCESS",
            payload: {
              userName: user.name,
              userEmail: user.email,
            },
            status: "PENDING",
          },
        ],
        { session },
      );
    });

    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.status(201).json({
      message: "User registered successfully!",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token: token,
    });
  } catch (error) {
    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }

      return res.status(400).json({
        message: "User registration failed",
        errors,
      });
    }

    if (error.code === 11000 && error.keyValue.email) {
      return res.status(409).json({
        message: "Email already in use",
      });
    }

    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const key = `login:${req.ip}:${email}`;

    if (isRateLimited(key, 5, 60 * 1000)) {
      return res.status(429).json({
        message: "Too many login attempts. Try again later.",
      });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Credentials",
      });
    }

    const token = generateToken(user._id);

    setTokenCookie(res, token);

    res.status(200).json({
      message: "User logged in successfully!",
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
      },
      token: token,
    });
  } catch (error) {
    res.status(500).json({
      message: "Something went wrong",
      error: error.message,
    });
  }
}

async function userLogoutController(req, res) {
  const token = extractToken(req);

  if (!token) {
    return res.status(200).json({
      message: "User logged out successfully",
    });
  }

  const decoded = jwt.decode(token);

  if (!decoded || !decoded.exp) {
    return res.status(400).json({
      message: "Invalid token",
    });
  }

  await TokenBlacklist.create({
    token,
    expiresAt: new Date(decoded.exp * 1000),
  });

  res.clearCookie("token");

  return res.status(200).json({
    message: "User logged out successfully",
  });
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
