import { Router } from "express";
import {
  getReminders,
  updateCustomerDates,
  sendWish,
  renderRemindersPage
} from "../controllers/reminder.controller.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

/* =====================================================
   REMINDERS PAGE (UI)
   URL: /reminders
   ===================================================== */
router.get(
  "/reminders",
  verifyUser,
  renderRemindersPage
);

/* =====================================================
   API: GET REMINDERS
   Frontend calls:
   GET /api/v1/reminders?days=30
   ===================================================== */
router.get(
  "/api/v1/reminders",
  verifyUser,
  getReminders
);

/* =====================================================
   API: UPDATE DOB / ANNIVERSARY
   Frontend calls:
   PUT /api/v1/reminders/customer/:customerId
   ===================================================== */
router.put(
  "/api/v1/reminders/customer/:customerId",
  verifyUser,
  updateCustomerDates
);

/* =====================================================
   API: SEND WISH (WhatsApp / Email)
   Frontend calls:
   POST /api/v1/reminders/send-wish
   ===================================================== */
router.post(
  "/api/v1/reminders/send-wish",
  verifyUser,
  sendWish
);

export default router;
