export interface Notification {
  ID: string;
  Type: "Placement" | "Result" | "Event";
  Message: string;
  Timestamp: string;
}

export interface ScoredNotification extends Notification {
  priorityScore: number;
}