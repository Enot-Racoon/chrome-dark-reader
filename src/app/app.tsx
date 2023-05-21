import React from "react";
import ReactDOM from "react-dom/client";

import "./base.css";

export default function App(View: React.ComponentType) {
  const rootElement = window.document.createElement("div");
  rootElement.id = "chrome-dark-reader";
  window.document.body.appendChild(rootElement);

  const root = ReactDOM.createRoot(rootElement);
  root.render(
    <React.StrictMode>
      <View />
    </React.StrictMode>
  );
}
