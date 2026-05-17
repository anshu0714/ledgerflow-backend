const User = require("../models/user.model");
const TokenBlacklist = require("../models/tokenBlacklist.model");
const jwt = require("jsonwebtoken");

const {
  extractToken,
  setTokenCookie,
  generateToken,
} = require("../utils/token.utils");

const Outbox = require("../models/outbox.model");
const getOutboxQueue = require("../queues/outbox.queue");
const runInTransaction = require("../utils/dbTransaction.utils");
const { success, error } = require("../utils/apiResponse.utils");
const { isRateLimited } = require("../services/rateLimiter.service");
const logger = require("../utils/logger.utils");

async function userRegisterController(req, res) {
  try {
    const { email, name, password } = req.body;

    const key = `register:${req.ip}`;

    if (await isRateLimited(key, 3, 60)) {
      logger.warn("Rate limit exceeded for registration", {
        requestId: req.requestId,
        ip: req.ip,
        email,
      });

      return error(res, "Too many registrations. Try later.", 429);
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      logger.info("Registration failed - email already exists", {
        requestId: req.requestId,
        email,
      });

      return error(res, "Email already in use", 409);
    }

    let user;
    let outboxEventId;

    await runInTransaction(async (session) => {
      const [createdUser] = await User.create([{ email, name, password }], {
        session,
      });

      user = createdUser;

      const [outboxEvent] = await Outbox.create(
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

      outboxEventId = outboxEvent._id.toString();
    });

    if (outboxEventId) {
      try {
        const outboxQueue = getOutboxQueue();

        if (!outboxQueue) {
          logger.warn("Queue unavailable");
          return;
        }

        await outboxQueue.add(
          "registration-email",

          {
            outboxId: outboxEventId,
          },

          {
            jobId: outboxEventId,
          },
        );
      } catch (err) {
        logger.error("Queue enqueue failed", {
          outboxEventId,
          error: err.message,
        });
      }
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
      "User registered successfully!",
      201,
    );
  } catch (err) {
    logger.error("User registration failed", {
      requestId: req.requestId,
      email: req.body?.email,
      error: err.message,
      stack: err.stack,
    });

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

    if (await isRateLimited(key, 5, 60)) {
      logger.warn("Rate limit exceeded for login", {
        requestId: req.requestId,
        ip: req.ip,
        email,
      });

      return error(res, "Too many login attempts", 429);
    }

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      logger.info("Login failed - user not found", {
        requestId: req.requestId,
        email,
      });

      return error(res, "Invalid credentials", 401);
    }

    const isValid = await user.comparePassword(password);

    if (!isValid) {
      logger.info("Login failed - invalid password", {
        requestId: req.requestId,
        userId: user._id,
        email,
      });

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
    logger.error("Login failed", {
      requestId: req.requestId,
      email: req.body?.email,
      error: err.message,
      stack: err.stack,
    });

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
      logger.error("Logout failed - invalid token structure", {
        requestId: req.requestId,
      });

      return error(res, "Invalid token", 400);
    }

    await TokenBlacklist.create({
      token,
      expiresAt: new Date(decoded.exp * 1000),
    });

    res.clearCookie("token");

    return success(res, {}, "Logged out successfully");
  } catch (err) {
    logger.error("Logout failed", {
      requestId: req.requestId,
      error: err.message,
      stack: err.stack,
    });

    return error(res, "Logout failed");
  }
}

module.exports = {
  userRegisterController,
  userLoginController,
  userLogoutController,
};
