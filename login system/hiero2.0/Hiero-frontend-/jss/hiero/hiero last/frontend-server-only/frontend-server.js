const express = require("express");
const path = require("path");

const app = express();
const PORT = 8082;

// ✅ Serve all static files (HTML, CSS, JS, images) from "public" folder
app.use(express.static(path.join(__dirname, "public")));

// ✅ Main route serves your homepage (index.html)
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Optional: Catch-all route for other HTML files (if using router links)
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ✅ Start the server
app.listen(PORT, () => {
  console.log(`✅ Frontend running at http://localhost:${PORT}`);
});