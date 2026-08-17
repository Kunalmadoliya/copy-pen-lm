import "dotenv/config";
import express from "express";

const app = express();
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
