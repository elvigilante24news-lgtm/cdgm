import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Build stamp: ensures new build produces different hashed filenames
// Timestamp: 2026-05-29T00:00:00Z
createRoot(document.getElementById("root")!).render(<App />);
