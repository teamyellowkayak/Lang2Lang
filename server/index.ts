import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import cors from 'cors'; 

const app = express();

// Configure CORS options
const corsOptions = {
  // This must be the exact origin of your frontend, which is hosted on GCS.
  // It should be 'https://storage.googleapis.com' for your deployed app.
  origin: 'https://storage.googleapis.com',
  methods: ['GET', 'HEAD', 'PUT', 'PATCH', 'POST', 'DELETE'], // Allowed methods
  credentials: true, // Allow sending cookies/auth headers (useful if you add auth later)
  optionsSuccessStatus: 204 // For preflight requests
};

// Use the cors middleware
app.use(cors(corsOptions));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

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
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      console.log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });


// Cloud Run will provide a PORT environment variable.
// For local development, we can fall back to 5000.
  const port = process.env.PORT || 5000; // THIS IS THE CRUCIAL CHANGE

  server.listen({
    port: Number(port), // Ensure it's a number, as env vars are strings
    host: "0.0.0.0", // Listen on all network interfaces
    reusePort: true, // This might not be strictly necessary for Cloud Run, but harmless
  }, () => {
  console.log(`serving on port ${port}`);
});

})();
