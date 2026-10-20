const Blogs = require("../models/blogs"); // Import the Blogs model to interact with the blogs collection in the database
const Users = require("../models/users");
const { getPaginatedandSortedBlogs } = require("../services/blogService");
const {
  getBlogImageErrorMessage,
  removeBlogImage,
  saveBlogImage,
} = require("../utils/blogImageUpload");

const cleanBlogImage = async (imagePath) => {
  try {
    await removeBlogImage(imagePath);
  } catch (error) {
    console.error("Error removing blog image:", error);
  }
};

const getBlogAuthors = async (blogs) => {
  const userIds = [
    ...new Set(blogs.map((blog) => blog.userId).filter(Boolean)),
  ];
  const authors = await Users.find({ _id: { $in: userIds } }).select(
    "name createdAt",
  );

  const pairs = authors.map((author) => [author._id.toString(), author]);
  return new Map(pairs); // the Map object allows for efficient retrieval of author information based on userId, which is useful when rendering the blogs with their respective authors.
  // Map turns those pairs into a key-value lookup
};

const homePageController = async (req, res) => {
  const sortOrder = req.query.sort === "oldest" ? "oldest" : "newest";

  try {
    const pageData = await getPaginatedandSortedBlogs({
      page: req.query.page,
      sortOrder,
    });
    const authorsById = await getBlogAuthors(pageData.blogs);
    const blogsWithRespectiveAuthor = pageData.blogs.map((blog) => ({
      ...blog.toObject(),
      author: authorsById.get(blog.userId) ?? null,
    }));

    return res.status(200).render("home", {
      ...pageData,
      blogsWithRespectiveAuthor,
      loadError: null,
    });
  } catch (error) {
    console.error("Error loading home page blogs:", error);
    return res.status(500).render("home", {
      blogs: [],
      currentPage: 1,
      totalPages: 0,
      totalBlogs: 0,
      sortOrder,
      firstBlogNumber: 0,
      lastBlogNumber: 0,
      loadError: "We couldn't load the blogs. Please try again.",
    });
  }
};

const userProfileBlogsController = async (req, res) => {
  try {
    const author = await Users.findById(req.params.userId).select(
      "name createdAt",
    );

    if (!author) {
      return res.status(404).render("notFound");
    }

    const sortOrder = req.query.sort === "oldest" ? "oldest" : "newest";
    const pageData = await getPaginatedandSortedBlogs({
      page: req.query.page,
      sortOrder,
      filter: { userId: author._id.toString() },
    });

    return res.status(200).render("userBlogs", {
      ...pageData,
      author,
      loadError: null,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.status(404).render("notFound");
    }

    console.error("Error loading public author profile:", error);
    return res.status(500).render("userBlogs", {
      blogs: [],
      author: null,
      currentPage: 1,
      totalPages: 0,
      totalBlogs: 0,
      sortOrder: req.query.sort === "oldest" ? "oldest" : "newest",
      firstBlogNumber: 0,
      lastBlogNumber: 0,
      loadError: "We couldn't load this profile's blogs. Please try again.",
    });
  }
};

const blogNotices = {
  created: { text: "Your blog was published.", type: "success" },
  updated: { text: "Your changes were saved.", type: "success" },
  deleted: { text: "The blog was deleted.", type: "success" },
  allDeleted: { text: "All your blogs were deleted.", type: "success" },
  noneToDelete: {
    text: "You don't have any blogs to delete.",
    type: "success",
  },
  notFound: {
    text: "That blog could not be found in your account.",
    type: "error",
  },
  editError: {
    text: "We couldn't open that blog for editing. Please try again.",
    type: "error",
  },
  deleteError: {
    text: "We couldn't delete the blog. Please try again.",
    type: "error",
  },
  deleteAllError: {
    text: "We couldn't delete your blogs. Please try again.",
    type: "error",
  },
};

const getBlogNotice = (req) => {
  if (req.query.created === "1") return blogNotices.created;

  const noticeKey = {
    updated: "updated",
    deleted: "deleted",
    allDeleted: "allDeleted",
    noneToDelete: "noneToDelete",
    notFound: "notFound",
    editError: "editError",
    deleteError: "deleteError",
    deleteAllError: "deleteAllError",
  }[req.query.result];

  return noticeKey ? blogNotices[noticeKey] : null;
};

const renderBlogForm = (
  res,
  { formData, message = null, status = 200, blogId = null, imagePath = null },
) => {
  const isEditing = blogId !== null;

  return res.status(status).render("addBlog", {
    message,
    formData,
    formTitle: isEditing ? "Edit your blog" : "Write a blog",
    formSubtitle: isEditing
      ? "Make your changes, then save your story."
      : "A good idea deserves a place to grow.",
    formAction: isEditing ? `/api/blogs/${blogId}/edit` : "/api/addBlog",
    submitLabel: isEditing ? "Save changes" : "Publish blog",
    imagePath,
  });
};

const myBlogsController = async (req, res) => {
  try {
    const userId = req.session.userId;
    // Limit results to this author and show the newest blog first.
    const blogs = await Blogs.find({ userId }).sort({ createdAt: -1 });
    // console.log("Fetched blogs:", blogs); // Log the fetched blogs for debugging purposes

    return res.status(200).render("myBlogs", {
      blogs,
      notice: getBlogNotice(req),
      // Keep database errors separate from a successful query with zero results.
      loadError: null,
    });
  } catch (error) {
    console.error("Error fetching blogs:", error);
    return res.status(500).render("myBlogs", {
      blogs: [],
      notice: null,
      loadError: "We couldn't load your blogs. Please try again.",
    });
  }
};

const showAddBlogFormController = (req, res) => {
  return renderBlogForm(res, {
    formData: { title: "", body: "" },
  });
};

const createBlogController = async (req, res) => {
  const formBody = req.body ?? {};
  const title = typeof formBody.title === "string" ? formBody.title.trim() : "";
  const body = typeof formBody.body === "string" ? formBody.body.trim() : "";
  const formData = { title, body };
  const imageErrorMessage = getBlogImageErrorMessage(req.blogImageUploadError);

  if (!title || !body || imageErrorMessage) {
    return renderBlogForm(res, {
      message:
        imageErrorMessage || "Add both a title and the body of your blog.",
      formData,
      status: 400,
    });
  }

  let imagePath = null;

  try {
    imagePath = await saveBlogImage(req.file);
    await Blogs.create({
      title,
      body,
      imagePath,
      userId: req.session.userId,
    });

    return res.redirect(303, "/api/myBlogs?created=1");
  } catch (error) {
    await cleanBlogImage(imagePath);
    const uploadErrorMessage = getBlogImageErrorMessage(error);

    if (uploadErrorMessage) {
      return renderBlogForm(res, {
        message: uploadErrorMessage,
        formData,
        status: 400,
      });
    }

    console.error("Error creating blog:", error);
    return renderBlogForm(res, {
      message: "We couldn't publish your blog. Please try again.",
      formData,
      status: 500,
    });
  }
};

const showEditBlogFormController = async (req, res) => {
  try {
    const blog = await Blogs.findOne({
      _id: req.params.blogId,
      userId: req.session.userId,
    });

    if (!blog) {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    return renderBlogForm(res, {
      blogId: blog._id.toString(),
      formData: { title: blog.title, body: blog.body },
      imagePath: blog.imagePath,
    });
  } catch (error) {
    if (error.name === "CastError") {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    console.error("Error loading blog for editing:", error);
    return res.redirect(303, "/api/myBlogs?result=editError");
  }
};

const updateBlogController = async (req, res) => {
  const formBody = req.body ?? {};
  const title = typeof formBody.title === "string" ? formBody.title.trim() : "";
  const body = typeof formBody.body === "string" ? formBody.body.trim() : "";
  const blogId = req.params.blogId;
  const formData = { title, body };
  let existingImagePath = null;
  let replacementImagePath = null;

  try {
    const blog = await Blogs.findOne({
      _id: blogId,
      userId: req.session.userId,
    });

    if (!blog) {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    existingImagePath = blog.imagePath;
    const imageErrorMessage = getBlogImageErrorMessage(
      req.blogImageUploadError,
    );

    if (!title || !body || imageErrorMessage) {
      return renderBlogForm(res, {
        blogId,
        formData,
        imagePath: existingImagePath,
        message:
          imageErrorMessage || "Add both a title and the body of your blog.",
        status: 400,
      });
    }

    replacementImagePath = await saveBlogImage(req.file);
    blog.title = title;
    blog.body = body;
    if (replacementImagePath) blog.imagePath = replacementImagePath;
    await blog.save();

    if (replacementImagePath) {
      await cleanBlogImage(existingImagePath);
    }

    return res.redirect(303, "/api/myBlogs?result=updated");
  } catch (error) {
    await cleanBlogImage(replacementImagePath);

    if (error.name === "CastError") {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    const imageErrorMessage = getBlogImageErrorMessage(error);
    if (imageErrorMessage) {
      return renderBlogForm(res, {
        blogId,
        formData,
        imagePath: existingImagePath,
        message: imageErrorMessage,
        status: 400,
      });
    }

    console.error("Error updating blog:", error);
    return renderBlogForm(res, {
      blogId,
      formData,
      imagePath: existingImagePath,
      message: "We couldn't save your changes. Please try again.",
      status: 500,
    });
  }
};

const deleteBlogController = async (req, res) => {
  try {
    const blog = await Blogs.findOneAndDelete({
      _id: req.params.blogId,
      userId: req.session.userId,
    });

    if (!blog) {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    await cleanBlogImage(blog.imagePath);
    return res.redirect(303, "/api/myBlogs?result=deleted");
  } catch (error) {
    if (error.name === "CastError") {
      return res.redirect(303, "/api/myBlogs?result=notFound");
    }

    console.error("Error deleting blog:", error);
    return res.redirect(303, "/api/myBlogs?result=deleteError");
  }
};

const deleteAllBlogsController = async (req, res) => {
  try {
    const blogs = await Blogs.find({ userId: req.session.userId }).select(
      "imagePath",
    );
    const result = await Blogs.deleteMany({ userId: req.session.userId });
    await Promise.all(blogs.map((blog) => cleanBlogImage(blog.imagePath)));
    const notice = result.deletedCount > 0 ? "allDeleted" : "noneToDelete";

    return res.redirect(303, `/api/myBlogs?result=${notice}`);
  } catch (error) {
    console.error("Error deleting all blogs:", error);
    return res.redirect(303, "/api/myBlogs?result=deleteAllError");
  }
};

module.exports = {
  homePageController,
  userProfileBlogsController,
  myBlogsController,
  showAddBlogFormController,
  createBlogController,
  showEditBlogFormController,
  updateBlogController,
  deleteBlogController,
  deleteAllBlogsController,
};
