import axios from "axios";
import { Notification, ScoredNotification } from "./types";
import { TopNotificationsHeap } from "./priorityQueue";
import { getToken } from "./auth";

const TYPE_WEIGHT: Record<string, number> = {
  Placement: 3,
  Result: 2,
  Event: 1,
};

function scoreNotification(notification: Notification): number {
  const typeWeight = TYPE_WEIGHT[notification.Type] ?? 1;
  const ageInHours =
    (Date.now() - new Date(notification.Timestamp).getTime()) / (1000 * 60 * 60);
  return typeWeight * (1 / (ageInHours + 1));
}

export async function fetchAllNotifications(): Promise<Notification[]> {
  const token = await getToken();
  const response = await axios.get<{ notifications: Notification[] }>(
    "http://20.207.122.201/evaluation-service/notifications",
    { headers: { Authorization: `Bearer ${token}` } }
  );
  return response.data.notifications;
}

export async function getTopNotifications(topN: number = 10): Promise<ScoredNotification[]> {
  const notifications = await fetchAllNotifications();
  const heap = new TopNotificationsHeap(topN);

  for (const notification of notifications) {
    const priorityScore = scoreNotification(notification);
    heap.insert({ ...notification, priorityScore });
  }

  return heap.getTopN();
}