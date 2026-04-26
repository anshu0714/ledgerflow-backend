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
const { success, error } = require("../utils/apiResponse.utils");
const { isRateLimited } = require("../utils/rateLimiter.utils");

async function userRegisterController(req, res) {
  try {
    const { email, name, password } = req.body;

    const key = `register:${req.ip}`;

    if (isRateLimited(key, 3, 60 * 1000)) {
      return error(res, "Too many registrations. Try later.", 429);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return error(res, "Email already in use", 409);
    }

    let user;

    await runInTransaction(async (session) => {
      const [createdUser] = await User.create([{ email, name, password }], {
        session,
      });

      user = createdUser;

      await Outbox.create(
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

    return success(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      "User registered successfully!",
      201,
    );
  } catch (err) {
    if (err.code === 11000) {
      return error(res, "Email already exists", 409);
    }

    return error(res, "User registration failed");
  }
}

async function userLoginController(req, res) {
  try {
    const { email, password } = req.body;

    const key = `login:${req.ip}:${email}`;

    if (isRateLimited(key, 5, 60 * 1000)) {
      return error(res, "Too many login attempts", 429);
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return error(res, "Invalid credentials", 401);
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      return error(res, "Invalid credentials", 401);
    }

    const token = generateToken(user._id);
    setTokenCookie(res, token);

    return success(
      res,
      {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
        },
        token,
      },
      "Login successful",
    );
  } catch (err) {
    return error(res, "Login failed");
  }
}

async function userLogoutController(req, res) {
  try {
    const token = extractToken(req);

    if (!token) {
      return success(res, {}, "Logged out successfully");
    }

    const decoded = jwt.decode(token);

    if (!decoded || !decoded.exp) {
      return error(res, "Invalid token", 400);
    }

    await TokenBlacklist.create({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });

    res.clearCookie("token");

    return success(res, {}, "Logged out successfully");
  } catch (err) {
    return error(res, "Logout failed");
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
