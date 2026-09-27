import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./styles.css";

// BrowserRouter lives here, once, at the top of the tree: the router belongs to
// the app, not to any screen. main.jsx imports exactly one stylesheet
// styles.css is the single global sheet and it pulls in the design tokens.
ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);