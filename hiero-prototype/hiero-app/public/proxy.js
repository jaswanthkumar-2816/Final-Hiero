const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const path = require("path");
const cors = require("cors");

const app = express();

// Enable CORS for all routes
app.use(cors());

// Parse JSON bodies
app.use(express.json());

// When user opens "/", serve your started.html directly
app.get("/", (req, res) => {
  res.sendFile(
    path.join(
      __dirname,
      "../jss/hiero/hiero last/started.html"
    )
  );
});

// Backend analysis server (port 5001)
app.use(
  "/api",
  createProxyMiddleware({
    target: "http://localhost:5001",
    changeOrigin: true,
    pathRewrite: { "^/api": "/api" },
    onError: (err, req, res) => {
      console.error('Proxy error:', err);
      res.status(500).json({ error: 'Backend server unavailable' });
    }
  })
);

// Backend main server (port 5000)
app.use(
  "/main",
  createProxyMiddleware({
    target: "http://localhost:5000",
    changeOrigin: true,
    pathRewrite: { "^/main": "" },
    onError: (err, req, res) => {
      console.error('Main server proxy error:', err);
      res.status(500).json({ error: 'Main server unavailable' });
    }
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    timestamp: new Date().toISOString(),
    services: {
      analysis: "http://localhost:5001",
      main: "http://localhost:5000"
    }
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Proxy server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(5503, () => {
  console.log("✅ Proxy server running at http://localhost:5503");
  console.log("📡 Proxying /api/* to http://localhost:5001");
  console.log("📡 Proxying /main/* to http://localhost:5000");
  console.log("🏥 Health check: http://localhost:5503/health");
});