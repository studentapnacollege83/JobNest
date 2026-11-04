/* cd "C:\Users\ADMIN\Desktop\Job Internship Portal" */
//npx @tailwindcss/cli -i ./input.css -o ./public/output.css
//npx @tailwindcss/cli -i ./input.css -o ./public/output.css --watch

require("dotenv").config();

const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const Application = require("./models/Application");

// Routers
const dashboardRouter = require("./routes/dashboardRouter");
const authRouter = require("./routes/authRouter");
const homeRouter = require("./routes/homeRouter");
const jobRouter = require("./routes/jobRouter");

const app = express();

const PORT = process.env.PORT || 3000;
const SESSION_SECRET = process.env.SESSION_SECRET;
const rawMongoUri = process.env.MONGODB_URI;

function configurationError(message) {
  console.error(`Configuration error: ${message}`);
  process.exit(1);
}

// Validate configuration before either database client is initialized. This avoids
// leaking connection strings and makes deployment errors actionable.
if (typeof rawMongoUri !== "string" || rawMongoUri.trim() === "") {
  configurationError("MONGODB_URI is required.");
}

const MONGODB_URI = rawMongoUri.trim();

if (!/^mongodb(?:\+srv)?:\/\//i.test(MONGODB_URI)) {
  configurationError(
    "MONGODB_URI must start with mongodb:// or mongodb+srv://. Check the Render environment variable name and value; do not include placeholder text or enclosing quotes."
  );
}

if (typeof SESSION_SECRET !== "string" || SESSION_SECRET.trim() === "") {
  configurationError("SESSION_SECRET is required.");
}

// Trust the hosting proxy in production (HTTPS deployments)
if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

// EJS Setup
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

// General Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

// MongoDB Session Store
let store;

try {
  store = new MongoDBStore({
    uri: MONGODB_URI,
    collection: "sessions",
  });
} catch (error) {
  configurationError(
    "MONGODB_URI could not be used to initialize the session store. Verify that it is a valid MongoDB connection string."
  );
}

store.on("error", () => {
  console.error(
    "Session store error: MongoDB session storage is unavailable. Check MongoDB connectivity and configuration."
  );
});

// Session Middleware
app.use(
  session({
    secret: SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);

// Global View Locals & Hiring Notifications
app.use(async (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  res.locals.unreadHiringNotifications = 0;

  try {
    const user = req.session.user;

    if (user && user.role === "jobSeeker") {
      res.locals.unreadHiringNotifications =
        await Application.countDocuments({
          applicant: user.id,
          status: "Hired",
          "hiringDetails.notificationRead": { $ne: true },
        });
    }

    next();
  } catch (error) {
    console.error("Notification count error:", error);
    next(error);
  }
});

// Application Routes
app.use("/", authRouter);
app.use("/", homeRouter);
app.use("/", dashboardRouter);
app.use("/", jobRouter);

// 404 Handler — unknown routes

 // 404 Handler — unknown routes
app.use((req, res) => {
  return res.status(404).render("error", {
    statusCode: 404,
    title: "Page Not Found",
    message:
      "Looks like this page went on a little adventure. The page you're looking for doesn't exist or may have moved.",
  });
});

// Central Error Handler
app.use((error, req, res, next) => {
  console.error("Application error:", error);

  if (res.headersSent) {
    return next(error);
  }

  return res.status(500).render("error", {
    statusCode: 500,
    title: "Something Went Wrong",
    message:
      "We couldn't complete your request right now. Please try again or return to the homepage.",
  });
});


// Central Error Handler
app.use((error, req, res, next) => {
  console.error("Application error:", error);

  if (res.headersSent) {
    return next(error);
  }

  res.status(500).send(
    "Something went wrong. Please try again later."
  );
});

// Connect to MongoDB before starting the server
mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB successfully.");

    const server = app.listen(PORT, () => {
      console.log(`Web server active at: http://127.0.0.1:${PORT}`);
    });

    server.on("error", (error) => {
      console.error("Server startup error:", error.message);
    });
  })
  .catch(() => {
    console.error(
      "MongoDB connection failed. Check Atlas network access and the MONGODB_URI configuration."
    );
    process.exitCode = 1;
  });
