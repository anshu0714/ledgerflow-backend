const User = require("../models/user.model");
const TokenBlacklist = require("../models/tokenBlacklist.model");
const jwt = require("jsonwebtoken");
const emailService = require("../services/mail.service");
const {
  extractToken,
  setTokenCookie,
  generateToken,
  isTokenBlacklisted,
} = require("../utils/token.utils");

async function userRegisterController(req, res) {
  try {
    const { email, name, password } = req.body;

    if (!email || !name || !password) {
      return res
        .status(400)
        .json({ message: "All fields are required", status: "failed" });
    }

    const isUserExist = await User.findOne({ email });
    if (isUserExist) {
      return res.status(409).json({
        message: "User already exist with this email!",
        status: "failed",
      });
    }

    const user = await User.create({
      email,
      name,
      password,
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

    await emailService.userRegistrationEmail(user.name, user.email);
  } catch (error) {
    console.log("Something went wrong: ", error);

    if (error.name === "ValidationError") {
      const errors = {};
      for (let field in error.errors) {
        errors[field] = error.errors[field].message;
      }

      return res.status(400).json({
        message: "User registration failed",
        errors,
        status: "failed",
      });
    }

    if (error.code === 11000 && error.keyValue.email) {
      return res.status(409).json({
        message: "Email already in use",
        status: "failed",
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
      return res
        .status(400)
        .json({ message: "All fields are required", status: "failed" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({
        message: "Invalid Credentials",
        status: "failed",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        message: "Invalid Credentials",
        status: "failed",
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
    console.log("Something went wrong: ", error);

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
