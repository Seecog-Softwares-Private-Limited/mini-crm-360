// src/routes/leadForm.routes.js
import { Router } from "express";
import {
  renderLeadFormsPage,
  renderPublicForm,
  getLeadForms,
  getLeadForm,
  createLeadForm,
  updateLeadForm,
  deleteLeadForm,
  submitLeadForm,
  getEmbedCode,
  getFormSubmissions
} from "../controllers/leadForm.controller.js";
import { verifyUser } from "../middleware/authMiddleware.js";

const router = Router();

// Public routes (no auth required)
router.get("/forms/:slug", renderPublicForm); // Public form page
router.post("/api/v1/forms/:slug/submit", submitLeadForm); // Submit form

// Protected routes (auth required)
router.get("/lead-forms", verifyUser, renderLeadFormsPage); // Frontend page
router.get("/api/v1/lead-forms", verifyUser, getLeadForms); // Get all forms
router.get("/api/v1/lead-forms/:id", verifyUser, getLeadForm); // Get single form
router.post("/api/v1/lead-forms", verifyUser, createLeadForm); // Create form
router.put("/api/v1/lead-forms/:id", verifyUser, updateLeadForm); // Update form
router.delete("/api/v1/lead-forms/:id", verifyUser, deleteLeadForm); // Delete form
router.get("/api/v1/lead-forms/:id/embed", verifyUser, getEmbedCode); // Get embed code
router.get("/api/v1/lead-forms/:id/submissions", verifyUser, getFormSubmissions); // Get form submissions

export default router;


