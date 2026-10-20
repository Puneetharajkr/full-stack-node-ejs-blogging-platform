const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const userSchema = new Schema(
  {
    name: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
    },
    password: {
      type: String,
      required: true,
    },
  },
  { timestamps: true }, // the timestamps option automatically adds createdAt and updatedAt fields to the schema,
  // which will store the timestamps of when a document is created and last updated, respectively.
);

// here we are creating a Mongoose model named "User" based on the userSchema.
// This model will be used to interact with the "users" collection in the MongoDB database. The model provides methods for performing CRUD (Create, Read, Update, Delete) operations on user documents in the database.
const Users = mongoose.model("User", userSchema);
module.exports = Users;
