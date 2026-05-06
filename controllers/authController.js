import User from "../models/userModel.js";
import bcrypt from "bcrypt";

const BCRYPT_ROUNDS = 10; // Cost factor for bcrypt

/**
 * Hash password using bcrypt
 */
async function hashPassword(password) {
  return await bcrypt.hash(password, BCRYPT_ROUNDS);
}

/**
 * Verify password against bcrypt hash
 */
async function verifyPassword(password, hash) {
  return await bcrypt.compare(password, hash);
}

/**
 * POST /auth/signup — Register a new user
 */
export async function signup(req, res, next) {
  try {
    const { username, password } = req.body;
    console.log(`[Auth] Signup attempt: "${username}"`);

    // Validation
    if (!username || username.length < 3) {
      return res
        .status(400)
        .json({ message: "Username must be at least 3 characters." });
    }
    if (!password || password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters." });
    }

    // Check if username exists
    const existingUser = await User.findOne({ username: username.toLowerCase() });
    if (existingUser) {
      console.warn(`[Auth] Signup rejected: Username "${username}" taken`);
      return res
        .status(409)
        .json({ message: "Username already taken!" });
    }

    // Hash password and create user
    const hashedPassword = await hashPassword(password);
    const newUser = await User.create({
      username: username.toLowerCase(),
      password: hashedPassword,
      score: 0,
      highScore: 0,
      gamesPlayed: 0,
    });

    // Store user in session
    req.session.user = {
      id: newUser._id.toString(),
      username: newUser.username,
      score: newUser.score,
    };

    console.log(`[Auth] User created: ${newUser.username} (${newUser._id})`);
    res.status(201).json({
      message: "User registered successfully",
      user: req.session.user,
    });
  } catch (error) {
    console.error("[Auth] Signup error:", error);
    next(error);
  }
}

/**
 * POST /auth/signin — Log in a user
 */
export async function signin(req, res, next) {
  try {
    const { username, password } = req.body;
    console.log(`[Auth] Signin attempt: "${username}"`);

    if (!username || !password) {
      return res.status(400).json({ message: "Please fill in all fields." });
    }

    // Find user by username (case-insensitive)
    const user = await User.findOne({ username: username.toLowerCase() });
    if (!user) {
      console.warn(`[Auth] Signin failed: User "${username}" not found`);
      return res
        .status(401)
        .json({ message: "No account found. Check your username or sign up!" });
    }

    // Verify password
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      console.warn(`[Auth] Signin failed: Wrong password for "${username}"`);
      return res.status(401).json({ message: "Wrong password! Try again." });
    }

    // Store user in session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      score: user.score,
    };

    console.log(`[Auth] User signed in: ${user.username}`);
    res.status(200).json({
      message: "Logged in successfully",
      user: req.session.user,
    });
  } catch (error) {
    console.error("[Auth] Signin error:", error);
    next(error);
  }
}

/**
 * POST /auth/logout — Log out a user
 */
export async function logout(req, res, next) {
  try {
    const username = req.session.user?.username;
    req.session.destroy((err) => {
      if (err) return next(err);
      console.log(`[Auth] User logged out: ${username || 'Unknown'}`);
      res.status(200).json({ message: "Logged out successfully" });
    });
  } catch (error) {
    console.error("[Auth] Logout error:", error);
    next(error);
  }
}

/**
 * GET /auth/session — Get current user session
 */
export async function getSession(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Fetch latest user data to ensure dashboard is up to date
    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(401).json({ message: "User not found" });
    }
    
    req.session.user.score = user.score;
    req.session.user.highScore = user.highScore;
    req.session.user.gamesPlayed = user.gamesPlayed;
    
    res.status(200).json({ user: req.session.user });
  } catch (error) {
    console.error("[Auth] Get session error:", error);
    next(error);
  }
}

/**
 * PUT /auth/update-password — Update user password
 */
export async function updatePassword(req, res, next) {
  try {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ message: "Password must be at least 6 characters." });
    }

    const user = await User.findById(req.session.user.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.password = await hashPassword(newPassword);
    await user.save();

    console.log(`[Auth] Password updated for user: ${user.username}`);
    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("[Auth] Update password error:", error);
    next(error);
  }
}
