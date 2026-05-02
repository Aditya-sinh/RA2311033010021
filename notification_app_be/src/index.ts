import dotenv from "dotenv";
dotenv.config();

import express from "express";
import router from "./routes";

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", router);

app.listen(PORT, () => {
  console.log(`Notification app running on http://localhost:${PORT}`);
  console.log(`Try: GET http://localhost:${PORT}/api/notifications/top?n=10`);
});