import dotenv from "dotenv";
dotenv.config();

import { initLogger, Log } from "./logger";

initLogger({
  email: process.env.EMAIL!,
  name: process.env.NAME!,
  rollNo: process.env.ROLL_NO!,
  accessCode: process.env.ACCESS_CODE!,
  clientID: process.env.CLIENT_ID!,
  clientSecret: process.env.CLIENT_SECRET!,
});

async function runTests() {
  const res1 = await Log("backend", "info", "service", "App started successfully");
  console.log("Log 1:", res1);

  const res2 = await Log("backend", "error", "handler", "Received string, expected boolean");
  console.log("Log 2:", res2);

  const res3 = await Log("backend", "fatal", "repository", "Database connection failed");
  console.log("Log 3:", res3);

  const res4 = await Log("backend", "warn", "route", "Deprecated endpoint was called");
  console.log("Log 4:", res4);
}

runTests();