const express = require("express");
const path = require("node:path");
require("dotenv").config();

const session = require("express-session");
const { MongoStore } = require("connect-mongo");
const routes = require("./routes/routes");
const connectDB = require("./database/dbConnection"); // Import the connectDB function from the database/dbConnection.js file to establish a connection to the MongoDB database
const { checkAuth } = require("./utils/auth"); // Import the checkAuth middleware to set the isAuthenticated variable in res.locals for all incoming requests

// // --------------------- EXPRESS APPLICATION/SERVER SETUP ---------------------------------------------
// Create an instance of the Express application/server
const app = express();

const sessionSecret =
  process.env.SESSION_SECRET ||
  (process.env.NODE_ENV === "production"
    ? null
    : "local-development-session-secret");

if (!sessionSecret) {
  throw new Error("SESSION_SECRET must be set in production");
}

// // ------------------------- BASIC/In-BUILT MIDDLEWAREs ---------------------------------------------
app.use(express.json()); // Middleware to parse incoming JSON requests for easier access to request data
app.use(express.urlencoded({ extended: true })); // Middleware to parse incoming URL-encoded requests (e.g., form submissions) for easier access to request data
app.use(
  "/uploads",
  express.static(path.join(__dirname, "public", "uploads"), {
    maxAge: "1y",
    immutable: true,
  }),
);

if (process.env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(
  session({
    name: "blog.sid",
    secret: sessionSecret,
    store: MongoStore.create({
      mongoUrl: process.env.MONGODB_URI,
      collectionName: "sessions",
    }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 24 * 60 * 60 * 1000,
    },
  }),
);
app.use(checkAuth);

// // ------------------------- VIEW ENGINE CONFIGURATION ---------------------------------------------
// Set the view engine to EJS for rendering dynamic HTML templates
app.set("view engine", "ejs"); // here we are telling express to use ejs as the view engine for rendering dynamic HTML templates

// // ------------------------- START SERVER AFTER DB CONNECTION ---------------------------------------------
const PORT_NUM = process.env.PORT || 3001;

async function startServer() {
  try {
    await connectDB();

    app.listen(PORT_NUM, "0.0.0.0", () => {
      console.log(`Server is running on port ${PORT_NUM}`);
    });
  } catch (error) {
    console.error("Could not start server:", error.message);
    process.exit(1);
  }
}

// // ------------------------- ROUTES CONFIGURATION ---------------------------------------------
app.use("/api", routes); // Use the routes defined in the routes/routes.js file for handling API requests starting with /api

app.use((req, res) => {
  if (req.accepts("html")) {
    return res.status(404).render("notFound");
  }

  return res.status(404).json({
    error: "Not Found",
    message: "The requested endpoint does not exist.",
  });
});

startServer(); // Start the server after establishing a successful connection to the database
