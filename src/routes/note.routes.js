// src/routes/note.routes.js
import { Router } from "express";
import {
  renderNotesPage,
  getCustomerTimeline,
  createNote,
  updateNote,
  deleteNote
} from "../controllers/note.controller.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

router.get("/notes", verifyUser, renderNotesPage); // Frontend page
router.get("/api/v1/notes/customer/:customerId", verifyUser, getCustomerTimeline); // Get timeline for customer
router.post("/api/v1/notes", verifyUser, createNote); // Create note
router.put("/api/v1/notes/:id", verifyUser, updateNote); // Update note
router.delete("/api/v1/notes/:id", verifyUser, deleteNote); // Delete note

export default router;

