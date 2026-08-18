import "dotenv/config";
import express from "express";
import {auth} from "./lib/auth.js";
import {toNodeHandler} from "better-auth/node";

const app = express();

app.all("/api/auth/*", toNodeHandler(auth));

const PORT = process.env.PORT || 8081;

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.send({status: "ok"});
});

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
