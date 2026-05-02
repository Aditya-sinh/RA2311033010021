export interface Depot {
  ID: number;
  MechanicHours: number;
}

export interface Vehicle {
  TaskID: string;
  Duration: number;
  Impact: number;
}

export interface ScheduleResult {
  depotID: number;
  mechanicHoursBudget: number;
  scheduledTasks: Vehicle[];
  totalDuration: number;
  totalImpact: number;
}