const bcrypt = require("bcrypt"); // Import the bcrypt library for password hashing and comparison
const base64 = require("base-64"); // Import the base-64 library for encoding and decoding base64 strings (not used in the current code but can be useful for encoding data)
const Users = require("../models/users"); // Import the Users model from the models/users.js file

const signupPageController = (req, res) => {
  // Handle GET request to /signup route
  res.render("signup", { message: null }); // Render the signup.ejs view and it will be used to display
  //  success or error messages while registering and mainly we can redirect to the
  // other pages with the help of this "message" object attribute.
};

const loginPageController = (req, res) => {
  // Handle GET request to /login route
  res.render("login", { message: null }); // Render the login.ejs view and it will be used to display
  //  success or error messages while logging attempts and mainly we can redirect to the
  // other pages with the help of this "message" object attribute.
};

const registerUserController = async (req, res) => {
  // Handle POST request to /register route from the signup form submission
  try {
    const { name, email, password } = req.body; // Extract name, email, and password from the request body
    const existingUser = await Users.findOne({ email }); // Check if a user with the provided email already exists in the database

    if (existingUser) {
      // return res
      //   .status(400)
      //   .json({ message: "User already exists in DB. Please try Login" }); // If user exists, send a 400 response with an error message

      return res.status(400).render("signup", {
        message: "User already exists in DB. Please try Login",
      }); // If user exists, render the signup view Page with an error message
    }
    const hashedPassword = await bcrypt.hash(password, 10); // Hash the password using bcrypt with a salt round of 10
    const newUser = new Users({ name, email, password: hashedPassword }); // Create a new user document using the Users model

    if (newUser) {
      await newUser.save(); // Save the new user document to the database
    } else {
      // return res
      //   .status(400)
      //   .json({ message: "User registration failed. Please try again later" }); // If user creation fails, send a 400 response with an error message

      return res.status(400).render("signup", {
        message: "User registration failed. Please try again later",
      }); // If user creation fails, render the signup view Page with an error message
    }

    // return res.status(200).json({ message: "User registered successfully" }); // Send a 200 response indicating successful/ok registration
    return res.status(200).render("login", {
      message: "User registered successfully. Please try to login",
    }); // If user registration is successful, render the login view Page with a success message
  } catch (error) {
    console.error("Error registering user:", error);
    // return res
    //   .status(500)
    //   .json({ message: "Internal server error. please contact support team" });
    return res.status(500).render("signup", {
      message: "Internal server error. please contact support team",
    }); // If an error occurs during registration, render the signup view Page with an error message
  }
};

const loginUserController = async (req, res) => {
  // Handle POST request to /login route from the login form submission
  try {
    const { email, password } = req.body; // Extract email and password from the request body
    const existingUser = await Users.findOne({ email }); // Find a user with the provided email in the database

    if (!existingUser) {
      return res.status(400).render("login", {
        message: "Invalid email or password",
      });
    }

    const isPasswordMatch = await bcrypt.compare(
      password,
      existingUser.password,
    ); // Compare the provided password with the hashed password

    if (!isPasswordMatch) {
      return res.status(400).render("login", {
        message: "Invalid email or password",
      });
    }

    await new Promise((resolve, reject) => {
      req.session.regenerate((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    req.session.userId = existingUser._id.toString();

    await new Promise((resolve, reject) => {
      req.session.save((error) => {
        if (error) reject(error);
        else resolve();
      });
    });

    return res.redirect("/api/home");
  } catch (error) {
    console.error("Error logging in user:", error);
    return res.status(500).render("login", {
      message: "Internal server error. Please contact support team",
    });
  }
};

const logoutUserController = (req, res, next) => {
  req.session.destroy((error) => {
    if (error) return next(error);

    res.clearCookie("blog.sid");
    return res.redirect("/api/login");
  });
};

const allUsersController = async (req, res) => {
  // Handle GET request to /allUsers route and render the all users view (protected route requiring authentication)
  try {
    const users = await Users.find(); // Fetch all users from the database

    if (!users) {
      return res
        .status(404)
        .render("allUsers", { users: [], message: "No users found" });
    } else {
      res.status(200).render("allUsers", { users, message: null }); // Render the allUsers.ejs view and pass the users data to it
    }
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).render("error", {
      message: "Internal server error. Please contact support team",
    });
  }
};

module.exports = {
  signupPageController,
  loginPageController,
  registerUserController,
  loginUserController,
  logoutUserController,
  allUsersController,
};
