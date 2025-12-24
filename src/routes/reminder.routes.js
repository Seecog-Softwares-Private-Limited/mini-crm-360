// src/routes/reminder.routes.js
import { Router } from "express";
import {
  renderRemindersPage,
  getUpcomingReminders,
  updateCustomerReminders,
  sendWish
} from "../controllers/reminder.controller.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/reminders", verifyUser, renderRemindersPage); // Frontend page
router.get("/api/v1/reminders", verifyUser, getUpcomingReminders); // Get upcoming reminders
router.put("/api/v1/reminders/customer/:customerId", verifyUser, updateCustomerReminders); // Update customer DOB/Anniversary
router.post("/api/v1/reminders/send-wish", verifyUser, sendWish); // Send wish

export default router;

