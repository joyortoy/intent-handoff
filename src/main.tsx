import { createRoot } from "react-dom/client";
import App from "./App";
import { beginWebMcpWatch } from "./webmcp/register";
import "./styles.css";

beginWebMcpWatch();
createRoot(document.getElementById("root")!).render(<App />);
