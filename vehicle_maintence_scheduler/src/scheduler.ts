import { Vehicle, ScheduleResult, Depot } from "./types";

export function scheduleVehicles(vehicles: Vehicle[], depot: Depot): ScheduleResult {
  const budget = depot.MechanicHours;
  const n = vehicles.length;

  const dp: number[] = new Array(budget + 1).fill(0);
  const selected: boolean[][] = Array.from({ length: n }, () =>
    new Array(budget + 1).fill(false)
  );

  for (let i = 0; i < n; i++) {
    const { Duration, Impact } = vehicles[i];
    for (let h = budget; h >= Duration; h--) {
      if (dp[h - Duration] + Impact > dp[h]) {
        dp[h] = dp[h - Duration] + Impact;
        selected[i][h] = true;
      }
    }
  }

  const scheduledTasks: Vehicle[] = [];
  let remainingHours = budget;

  for (let i = n - 1; i >= 0; i--) {
    if (selected[i][remainingHours]) {
      scheduledTasks.push(vehicles[i]);
      remainingHours -= vehicles[i].Duration;
    }
  }

  const totalDuration = scheduledTasks.reduce((sum, v) => sum + v.Duration, 0);
  const totalImpact = scheduledTasks.reduce((sum, v) => sum + v.Impact, 0);

  return {
    depotID: depot.ID,
    mechanicHoursBudget: depot.MechanicHours,
    scheduledTasks,
    totalDuration,
    totalImpact,
  };
}