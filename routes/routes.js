const express = require("express");
const router = express.Router(); // Create a new router instance using Express Router
const {
  signupPageController,
  loginPageController,
  registerUserController,
  loginUserController,
  logoutUserController,
  allUsersController,
} = require("../controllers/userControllers");
const {
  homePageController,
  userProfileBlogsController,
  myBlogsController,
  showAddBlogFormController,
  createBlogController,
  showEditBlogFormController,
  updateBlogController,
  deleteBlogController,
  deleteAllBlogsController,
} = require("../controllers/blogController"); // Import the homePageController function from the blogController.js file to handle rendering the home page
const { requireAuth } = require("../utils/auth"); // Import the requireAuth middleware to protect routes that require authentication
const { blogImageUpload } = require("../utils/blogImageUpload");

// // ------------------------- API ENDPOINTS DEVELOPMENT ------------------------------------------
// Define routes and associate them with controller functions
router.get("/signup", signupPageController); // Handle GET request to /signup route and render the signup view
router.get("/login", loginPageController); // Handle GET request to /login route and render the login view
router.post("/register", registerUserController); // Handle POST request to /register route from the signup form submission
router.post("/login", loginUserController); // Handle POST request to /login route from the login form submission

// The public home page shows blogs from all authors.
router.get("/home", homePageController);
router.get("/", homePageController);
router.get("/users/:userId", userProfileBlogsController);

// ------------------------- PROTECTED ROUTES ------------------------------------------
router.post("/logout", logoutUserController); // Handle POST request to /logout route to log out the user and destroy the session
router.get("/allUsers", requireAuth, allUsersController); // Handle GET request to /allUsers route and render the all users view (protected route requiring authentication)

router.get("/myBlogs", requireAuth, myBlogsController); // Handle GET request to /myBlogs route and render the myBlogs view (protected route requiring authentication)
router
  .route("/addBlog")
  .get(requireAuth, showAddBlogFormController)
  .post(requireAuth, blogImageUpload, createBlogController);

router
  .route("/blogs/:blogId/edit")
  .get(requireAuth, showEditBlogFormController)
  .post(requireAuth, blogImageUpload, updateBlogController); //

router.post("/blogs/:blogId/delete", requireAuth, deleteBlogController);
router.post("/myBlogs/delete-all", requireAuth, deleteAllBlogsController);

module.exports = router;
