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
let userIds = new Map(); // id -> token
if (fs.existsSync(dataFilePath)) {
  try {
    const data = JSON.parse(fs.readFileSync(dataFilePath, "utf8"));
    if (Array.isArray(data.userIds)) {
      // Backward compatibility with old format
      data.userIds.forEach(id => userIds.set(id, null));
    } else if (data.userIds) {
      // New format: { "userIds": { "id1": "token1", "id2": "token2" } }
      Object.entries(data.userIds).forEach(([id, token]) => userIds.set(id, token));
    }
  } catch (err) {
    console.error("Error reading userData.json:", err.message);
  }
}

// Helper to save user IDs to file
function saveUserIdsToFile() {
  try {
    const data = { userIds: Object.fromEntries(userIds) };
    fs.writeFileSync(dataFilePath, JSON.stringify(data, null, 2));
  } catch (err) {
    console.error("Error writing to userData.json:", err.message);
  }
}

// Helper to validate user ID format
function isValidUserId(userId) {
  const userIdRegex = /^[a-z0-9]{18,20}$/;
  return typeof userId === "string" && userIdRegex.test(userId);
}

// Helper to generate a token
function generateToken() {
  return Math.random().toString(36).substr(2, 10);
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
  const { userId, token } = req.body;

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
    const storedToken = userIds.get(userId);
    if (token && storedToken && token === storedToken) {
      return res.status(200).json({ status: "exists" });
    } else if (!token && !storedToken) {
      // Allow old clients without tokens (backward compatibility)
      return res.status(200).json({ status: "exists" });
    }
    return res.status(403).json({ error: "Invalid or missing token" });
  }

  // New userId: generate token, store, and return it
  const newToken = generateToken();
  userIds.set(userId, newToken);
  saveUserIdsToFile();
  return res.status(201).json({ status: "registered", token: newToken });
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
const PORT = process.env.PORT || 80; // Changed from 3000 to 80
app.listen(PORT, () => {
  console.log(
    `\nServer is listening on port ${PORT}.\n` +
    `Unique user IDs loaded: ${userIds.size}\n` +
    `Access at: http://vps.unityailab.online:${PORT}\n`
  );
});