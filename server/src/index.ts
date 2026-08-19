import "dotenv/config";
import express from "express";
import {auth} from "./lib/auth.js";
import {toNodeHandler} from "better-auth/node";
import cors from "cors";
import {env} from "prisma/config";
import { registerRoutes } from "./routes/index.js";
import { errorHandler } from "./middleware/error-handler.middleware.js";

const app = express();
const PORT = process.env.PORT || 8081;
const clientUrl = process.env.CLIENT_URL || "http://localhost:3000"; // Default to localhost:3000 if CLIENT_URL is not set

app.all("/api/auth/*", toNodeHandler(auth));

app.use(
  cors({
    origin: clientUrl,
    credentials: true,
  }),
);

app.get("/", (req, res) => {
  res.send("Hello, World!");
});

app.get("/health", (req, res) => {
  res.send({status: "ok"});
});

registerRoutes(app);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port http://localhost:${PORT}`);
});
