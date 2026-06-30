import React from "react";
import { createRoot } from "react-dom/client";
import "./styles.css";

function App() {
  return (
    <main className="app-shell">
      <section className="start-screen" aria-labelledby="app-title">
        <div>
          <p className="stage-label">开发里程碑 1</p>
          <h1 id="app-title">战术动画板</h1>
          <p className="intro">
            面向足球青训和基础教练的轻量 2D 现场白板。
          </p>
        </div>
        <button className="primary-action" type="button">
          进入现场白板
        </button>
      </section>
    </main>
  );
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
