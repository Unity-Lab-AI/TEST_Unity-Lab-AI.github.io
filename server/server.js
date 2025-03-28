const express = require("express");
const fs = require("fs");
const path = require("path");
const cors = require("cors");

// Create an Express app
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Path to JSON file for storing user IDs
const dataFilePath = path.join(__dirname, "userData.json");

// Load existing user IDs into memory at startup
let userIds = new Set();
if (fs.existsSync(dataFilePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    if (Array.isArray(data.userIds)) {
      userIds = new Set(data.userIds);
    }
  } catch (err) {
    console.error("Error reading userData.json:", err.message);
  }
}

// Helper to save user IDs to file
function saveUserIdsToFile() {
  try {
    const data = { userIds: [...userIds] };
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to userData.json:", err.message);
  }
}

// Helper to validate user ID format
function isValidUserId(userId) {
  // Must be a string, 18-20 characters, lowercase alphanumeric (a-z, 0-9)
  const userIdRegex = /^[a-z0-9]{18,20}$/;
  return typeof userId === "string" && userIdRegex.test(userId);
}

// Middleware for logging requests
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url} - IP: ${req.ip}`);
  next();
});

// =======================
//   REGISTER USER ID
// =======================
app.post("/api/registerUser", (req, res) => {
  const { userId } = req.body;

  // Validate request body
  if (!userId) {
    return res.status(400).json({ error: "Missing userId in request body" });
  }

  // Validate userId format
  if (!isValidUserId(userId)) {
    return res.status(400).json({ error: "Invalid userId format: must be 18-20 characters, lowercase alphanumeric (a-z, 0-9)" });
  }

  // Check if userId already exists
  if (userIds.has(userId)) {
    return res.status(200).json({ status: "exists" });
  }

  // Add new userId
  userIds.add(userId);
  saveUserIdsToFile();
  return res.status(201).json({ status: "registered" });
});

// =======================
//    VISITOR COUNT
// =======================
app.get("/api/visitorCount", (req, res) => {
  return res.status(200).json({ count: userIds.size });
});

// Basic health check endpoint
app.get("/health", (req, res) => {
  return res.status(200).json({ status: "OK" });
});

// Start the server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(
    `\nServer is listening on port ${PORT}.\n` +
    `Unique user IDs loaded: ${userIds.size}\n` +
    `Access at: http://vps.unityailab.online:${PORT}\n`
  );
});