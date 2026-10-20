const mongoose = require("mongoose");
const Schema = mongoose.Schema;

blogSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    body: {
      type: String,
      required: true,
    },
    imagePath: {
      type: String,
      default: null,
    },
    userId: {
      type: String,
      required: true,
    },
  },
  {
    timestamps: true,
  },
);

const Blogs = mongoose.model("Blogs", blogSchema);
module.exports = Blogs;
