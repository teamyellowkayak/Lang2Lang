import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";

// Set page title
document.title = "Lang2Lang - Learn Essential Language Skills";

createRoot(document.getElementById("root")!).render(<App />);
