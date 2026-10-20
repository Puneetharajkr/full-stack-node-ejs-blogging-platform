# Node.js Backend Blogging Project with .ejs(view engine) for server rendered UI/HTML Templates - for frontend interaction

A server-rendered blogging application built with Node.js, Express, MongoDB, and EJS. Users can publish and manage blog posts, upload optional cover images, browse posts from all authors, and view public author profiles.

## Features

- User registration, login, logout, and persistent sessions
- Create, edit, and delete your own blog posts
- Delete all of your own posts
- Optional cover-image uploads (JPEG, PNG, and WebP; up to 5 MB)
- Image validation, resizing, and WebP conversion with Sharp
- Public Home feed with newest/oldest sorting and pagination
- Public author profiles with each author's posts
- Responsive image thumbnails with a full-image viewer
- Empty, validation, and error states for a clearer user experience
- HTML 404 page, with JSON responses for clients that request JSON

## Technology

- Node.js 20.9 or later
- Express 5
- MongoDB and Mongoose
- EJS templates
- `express-session` with MongoDB-backed sessions (`connect-mongo`)
- Multer and Sharp for image upload processing

## Getting Started

### Prerequisites

- Node.js 20.9 or later
- npm
- A local MongoDB instance or a MongoDB Atlas cluster

### Install

```powershell
npm install
Copy-Item .env.example .env
```

Edit `.env` and set `MONGODB_URI` to your local MongoDB connection string or Atlas connection string. For Atlas, ensure the machine or hosting service can connect through the cluster's Network Access rules.

Set `SESSION_SECRET` to a long, random value. You can generate one locally with:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Do not commit `.env` or share its values. It is excluded by `.gitignore`.

### Environment variables

| Variable         | Required          | Description                                                                                    |
| ---------------- | ----------------- | ---------------------------------------------------------------------------------------------- |
| `MONGODB_URI`    | Yes               | MongoDB connection string for the application database and session store.                      |
| `SESSION_SECRET` | Yes in production | Secret used to sign session cookies. Set a unique, random value in every deployed environment. |
| `PORT`           | No                | HTTP port. Defaults to `3001`; hosting providers commonly provide this automatically.          |

### Run locally

Start in development mode with automatic restarts:

```powershell
npm run dev
```

Or start without nodemon:

```powershell
npm start
```

Open [http://localhost:3001/api/home](http://localhost:3001/api/home), or use the port configured by `PORT`.

The server connects to MongoDB before it begins listening. If startup fails, check the terminal error, `MONGODB_URI`, your Atlas Network Access list, and whether the database is reachable.

## Main Routes

All routes are mounted under `/api`.

| Method        | Path                        | Access        | Purpose                                                                       |
| ------------- | --------------------------- | ------------- | ----------------------------------------------------------------------------- |
| `GET`         | `/api/home` or `/api/`      | Public        | Browse all blogs; accepts a `page` number and `sort=newest` or `sort=oldest`. |
| `GET`         | `/api/users/:userId`        | Public        | View an author's public profile and posts; supports sorting and pagination.   |
| `GET`         | `/api/signup`               | Public        | Show registration form.                                                       |
| `POST`        | `/api/register`             | Public        | Register an account.                                                          |
| `GET`         | `/api/login`                | Public        | Show login form.                                                              |
| `POST`        | `/api/login`                | Public        | Start an authenticated session.                                               |
| `POST`        | `/api/logout`               | Session       | End the current session.                                                      |
| `GET`         | `/api/myBlogs`              | Authenticated | List the signed-in user's blogs.                                              |
| `GET`, `POST` | `/api/addBlog`              | Authenticated | Display the new-blog form and create a blog.                                  |
| `GET`, `POST` | `/api/blogs/:blogId/edit`   | Authenticated | Display the edit form and update an owned blog.                               |
| `POST`        | `/api/blogs/:blogId/delete` | Authenticated | Delete one owned blog.                                                        |
| `POST`        | `/api/myBlogs/delete-all`   | Authenticated | Delete all blogs owned by the signed-in user.                                 |
| `GET`         | `/api/allUsers`             | Authenticated | Show the user directory.                                                      |

Home and author profile pagination defaults to page 1 and newest-first ordering. The page size is configured in `services/blogService.js`.

## Image Uploads

Blog images are optional. The upload middleware accepts one JPEG, PNG, or WebP image up to 5 MB. Sharp validates the image content, corrects orientation, resizes it to fit within 1200 × 900 pixels without enlarging smaller images, and saves it as WebP with a generated filename.

The blog document stores the resulting image URL in `imagePath`; the image file itself is stored under `public/uploads` and served at `/uploads/...`. Uploaded files are excluded from Git.

**Deployment note:** local disk storage is suitable for development, but some hosting environments use ephemeral filesystems. For production deployments where local files may be lost during restarts or redeploys, use persistent storage or an object-storage/image-hosting service and store its URL in `imagePath`.

## Project Structure

```text
controllers/       Request handlers for users, blogs, and profiles
database/          MongoDB connection setup
models/            Mongoose schemas and models
routes/            Express route definitions
services/          Shared blog query, sorting, and pagination logic
utils/             Authentication and image-upload helpers
views/             EJS pages
  partials/         Shared navigation, styles, blog content, and image viewer
public/uploads/    Local generated blog images (ignored by Git)
index.js           Express application and server entry point
```

## Testing

There is currently no automated test suite configured. The `test` script in `package.json` is a placeholder and exits with a “no test specified” message.
