import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

// Initialize theme before render
const savedTheme = localStorage.getItem("theme-mode") || "dark";
document.documentElement.classList.add(savedTheme);
if (localStorage.getItem("glass-enabled") === "true") {
  document.documentElement.classList.add("glass-theme");
}

createRoot(document.getElementById("root")!).render(<App />);
