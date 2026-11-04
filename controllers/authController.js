
const User = require("../models/user");
const bcrypt = require("bcryptjs");
const crypto = require("crypto");

// Signup page
exports.getSignup = (req, res) => {
  res.render("auth/signup");
};

// Login page
exports.getLogin = (req, res) => {
  res.render("auth/login", {
    query: req.query,
  });
};

// Signup — Email verification temporarily disabled
exports.postSignup = async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    // Validate user role on the server
    if (!["jobSeeker", "employer"].includes(role)) {
      return res.status(400).send("Invalid user type.");
    }

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    if (!fullName || !normalizedEmail || !password) {
      return res.status(400).send(
        "Please fill in all required fields."
      );
    }

    if (typeof password !== "string" || password.length < 6) {
      return res.status(400).send(
        "Password must be at least 6 characters."
      );
    }

    // Check whether email already exists
    const existingUser = await User.findOne({
      email: normalizedEmail,
    });

    if (existingUser) {
      return res.status(409).send(
        "Email is already registered."
      );
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user — verified temporarily for local development
    const user = new User({
      fullName: fullName.trim(),
      email: normalizedEmail,
      password: hashedPassword,
      role,
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationTokenExpires: null,
    });

    await user.save();

    // Redirect to login after successful signup
    return res.redirect("/login?registered=1");
  } catch (error) {
    console.error("Signup error:", error.message);

    if (error.code === 11000) {
      return res.status(409).send(
        "Email is already registered."
      );
    }

    return res.status(500).send(
      "Something went wrong during signup."
    );
  }
};

// Login — Email verification temporarily disabled
exports.postLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    const normalizedEmail = String(email || "")
      .trim()
      .toLowerCase();

    const user = await User.findOne({
      email: normalizedEmail,
    });

    if (!user) {
      return res.status(401).send(
        "Invalid email or password."
      );
    }

    const isPasswordCorrect = await bcrypt.compare(
      password || "",
      user.password
    );

    if (!isPasswordCorrect) {
      return res.status(401).send(
        "Invalid email or password."
      );
    }

    // Create session after successful login
    req.session.regenerate((error) => {
      if (error) {
        console.error(
          "Session regeneration error:",
          error.message
        );

        return res.status(500).send(
          "Unable to log in right now."
        );
      }

      req.session.user = {
        id: user._id.toString(),
        fullName: user.fullName,
        email: user.email,
        role: user.role,
      };

      req.session.save((error) => {
        if (error) {
          console.error(
            "Session save error:",
            error.message
          );

          return res.status(500).send(
            "Unable to log in right now."
          );
        }

        return res.redirect("/");
      });
    });
  } catch (error) {
    console.error("Login error:", error.message);

    return res.status(500).send(
      "Something went wrong during login."
    );
  }
};

// Logout
exports.postLogout = (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      console.error("Logout error:", error.message);

      return res.status(500).send(
        "Unable to log out right now."
      );
    }

    res.clearCookie("connect.sid");

    return res.redirect("/");
  });
};

// Verify Email — kept for when verification is re-enabled
exports.verifyEmail = async (req, res) => {
  try {
    const { token } = req.query;

    // Check whether token is present and valid in format
    if (
      typeof token !== "string" ||
      !/^[a-f0-9]{64}$/i.test(token)
    ) {
      return res.status(400).send(
        "Invalid verification link."
      );
    }

    // Hash the token to match the value stored in MongoDB
    const hashedToken = crypto
      .createHash("sha256")
      .update(token)
      .digest("hex");

    // Find a user with a valid, unexpired token
    const user = await User.findOne({
      emailVerificationToken: hashedToken,
      emailVerificationTokenExpires: {
        $gt: new Date(),
      },
      isEmailVerified: false,
    });

    if (!user) {
      return res.status(400).send(
        "This verification link is invalid, expired, or already used."
      );
    }

    // Verify the email and invalidate the token
    user.isEmailVerified = true;
    user.emailVerificationToken = null;
    user.emailVerificationTokenExpires = null;

    await user.save();

    return res.redirect("/login?verified=1");
  } catch (error) {
    console.error(
      "Email verification error:",
      error.message
    );

    return res.status(500).send(
      "Unable to verify your email right now."
    );
  }
};
