import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "./components/GameApp";
import "./styles.css";

const root = document.getElementById("app");
if (!root) throw new Error("Planet Urf missing #app");

createRoot(root).render(
  <StrictMode>
    <GameApp />
  </StrictMode>,
);
