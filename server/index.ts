// server/index.ts

import express, { type Request, type Response, type NextFunction } from "express";
import { registerRoutes } from "./routes"; // Assuming this registers your API routes and auth middleware
import cors from 'cors';
import dotenv from 'dotenv'; // Import dotenv to load environment variables from .env

// Load environment variables from .env file
dotenv.config();

const app = express();

// TEMPORARY: VERY EARLY HEADER LOGGING
app.use((req, res, next) => {
  console.log('--- RAW HEADERS ON ENTRY ---');
  console.log(JSON.stringify(req.headers, null, 2));
  console.log('--- END RAW HEADERS ---');
  next();
});

// --- 1. CORS Configuration ---
// Configure allowed origins based on environment
const allowedOrigins = process.env.NODE_ENV === 'development'
  ? ['http://localhost:5173', 'https://storage.googleapis.com'] // Local dev frontend, and GCS general origin for testing
  : ['https://storage.googleapis.com']; // In production, the *exact* origin for GCS served static content

// Configure CORS options
const corsOptions = {
  origin: allowedOrigins,
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'],
  credentials: true, // Keep this true for authentication/sessions (if you use cookies/session IDs)
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Access-Password', 'x-access-password'],
  optionsSuccessStatus: 204 // Recommended for preflight OPTIONS requests
};

// Use the cors middleware. It should be applied early.
// This single line handles both preflight OPTIONS and actual requests.
app.use(cors(corsOptions));

// --- 2. Body Parsers ---
app.use(express.json()); // For parsing application/json
app.use(express.urlencoded({ extended: false })); // For parsing application/x-www-form-urlencoded

// --- 3. Custom Logging Middleware ---
// This middleware captures JSON responses for logging.
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        // Limit the logged JSON to prevent excessively long log lines
        const jsonString = JSON.stringify(capturedJsonResponse);
        logLine += ` :: ${jsonString.length > 100 ? jsonString.substring(0, 97) + "..." : jsonString}`;
      }

      // Ensure the overall log line does not exceed a reasonable length
      if (logLine.length > 200) { // Increased from 80 to 200 for more detail, adjust as needed
        logLine = logLine.slice(0, 197) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

// --- 4. Register Routes (including your authentication middleware) ---
// This should register all your API endpoints.
// Assuming registerRoutes will internally do something like:
// app.use("/api", authenticateLocalPassword, apiRouter);
registerRoutes(app);

// --- 5. Start the Server ---
const port = process.env.PORT || 8080;
// Cloud Run expects your server to listen on 0.0.0.0
app.listen(Number(port), "0.0.0.0", () => {
  console.log(`Server listening on port ${port}`);
});