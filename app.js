// Node.js Core Modules
const path = require("path");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const cookieParser = require("cookie-parser");
const ejsLayouts = require("express-ejs-layouts");
const express = require("express");




// Create Express application
const app = express();

// Middleware configuration
app.use(express.static(path.join(__dirname, "public"))); // Serve static files from 'public' directory
app.use(bodyParser.urlencoded({ extended: false })); // Parse URL-encoded bodies
app.use(express.json()); // Parse JSON bodies
app.use(cookieParser()); // Parse cookies

// Templating engine setup (EJS with layouts)
app.set("views", path.join(__dirname, "views")); // Set views directory
app.set("view engine", "ejs"); // Set view engine to EJS
app.use(ejsLayouts); // Use EJS layouts
app.set("layout", "./layouts/main"); // Set default layout

// Import custom route modules (controllers)
const userRoutes = require("./Routes/userRoutes");
const quotesRoutes = require("./Routes/quotesRoutes");
const profileRoutes = require("./Routes/profileRoutes");
const requestsRoutes = require("./Routes/requestsRoutes");
const messagesRoutes = require("./Routes/messagesRoutes");
const actionRoutes = require("./Routes/actionRoutes");

// Mount route handlers
app.use(userRoutes, messagesRoutes, requestsRoutes, quotesRoutes, profileRoutes, actionRoutes);

module.exports = { app };
