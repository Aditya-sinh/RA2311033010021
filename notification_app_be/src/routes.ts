import { Router, Request, Response } from "express";
import { getTopNotifications } from "./notificationService";

const router = Router();

router.get("/notifications/top", async (req: Request, res: Response) => {
  const topN = req.query.n ? parseInt(req.query.n as string) : 10;

  if (isNaN(topN) || topN < 1) {
    res.status(400).json({ error: "n must be a positive integer" });
    return;
  }

  const topNotifications = await getTopNotifications(topN);
  res.json({ count: topNotifications.length, notifications: topNotifications });
});

export default router;