import React from "react";
import ReactDOM from "react-dom/client";

import packageJson from "../package.json";

import App from "./App";

import "./index.css";

const rootElement = window.document.createElement("div");
rootElement.id = packageJson.name;
window.document.body.appendChild(rootElement);

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
