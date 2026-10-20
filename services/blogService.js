const Blogs = require("../models/blogs");

const BLOGS_PER_PAGE = 10;

const getPaginatedandSortedBlogs = async ({
  page: requestedPage,
  sortOrder: requestedSortOrder,
  filter = {},
}) => {
  const pageNumber = Number(requestedPage);
  const page = Number.isInteger(pageNumber) && pageNumber > 0 ? pageNumber : 1;
  const sortOrder = requestedSortOrder === "oldest" ? "oldest" : "newest";
  const sortDirection = sortOrder === "oldest" ? 1 : -1;

  const totalBlogs = await Blogs.countDocuments(filter);
  const totalPages = Math.ceil(totalBlogs / BLOGS_PER_PAGE);
  const currentPage = Math.min(page, Math.max(totalPages, 1));
  const blogs = await Blogs.find(filter)
    // Use the ID as a tie-breaker when multiple blogs share a timestamp.
    .sort({ createdAt: sortDirection, _id: sortDirection })
    .skip((currentPage - 1) * BLOGS_PER_PAGE)
    .limit(BLOGS_PER_PAGE);

  return {
    blogs,
    currentPage,
    totalPages,
    totalBlogs,
    sortOrder,
    firstBlogNumber:
      totalBlogs === 0 ? 0 : (currentPage - 1) * BLOGS_PER_PAGE + 1,
    lastBlogNumber: Math.min(currentPage * BLOGS_PER_PAGE, totalBlogs),
  };
};

module.exports = { getPaginatedandSortedBlogs };
