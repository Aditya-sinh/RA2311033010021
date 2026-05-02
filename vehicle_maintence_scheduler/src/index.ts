import dotenv from "dotenv";
dotenv.config();

import { getToken } from "./auth";
import { fetchDepots, fetchVehicles } from "./fetcher";
import { scheduleVehicles } from "./scheduler";

async function main() {
  console.log("Fetching auth token...");
  const token = await getToken();

  console.log("Fetching depots and vehicles from test server...");
  const [depots, vehicles] = await Promise.all([
    fetchDepots(token),
    fetchVehicles(token),
  ]);

  console.log(`Found ${depots.length} depots and ${vehicles.length} vehicles\n`);

  for (const depot of depots) {
    const result = scheduleVehicles(vehicles, depot);

    console.log(`--- Depot ${result.depotID} (Budget: ${result.mechanicHoursBudget} hours) ---`);
    console.log(`Scheduled ${result.scheduledTasks.length} vehicles`);
    console.log(`Total duration used: ${result.totalDuration} / ${result.mechanicHoursBudget} hours`);
    console.log(`Total impact score: ${result.totalImpact}`);
    console.log("Tasks:");
    result.scheduledTasks.forEach((v) => {
      console.log(`  TaskID: ${v.TaskID}  Duration: ${v.Duration}h  Impact: ${v.Impact}`);
    });
    console.log();
  }
}

main().catch((err) => {
  console.error("Fatal error:", err.response?.data || err.message);
  process.exit(1);
});