// Lang2Lang/client/src/config.ts

// Backend API Base URL (Cloud Run service URL)
export const API_BASE_URL = import.meta.env.DEV
  ? "http://localhost:5000" // Use local backend during development (npm run dev)
  : "https://lang2lang-dev-backend-453739630202.us-central1.run.app"; // Use Cloud Run URL for production builds (npm run build)


// Frontend Application Base Path (for Wouter router)
// This should match the sub-path where your index.html is served from on GCS.
// For example, if your app is at https://storage.googleapis.com/your_bucket_name/lang2lang-dev_frontend/index.html
// then the base path is '/lang2lang-dev_frontend'.
// For local development, it's typically just '/'.
export const FRONTEND_BASE_PATH = import.meta.env.PROD ? '/lang2lang-dev_frontend' : '/';