// src/routes/task.routes.js
import { Router } from 'express';
import { verifyUser } from '../middleware/authMiddleware.js';
import {
  renderTasksPage,
  getTasks,
  createTask,
  updateTask,
  deleteTask,
  getTaskStats
} from '../controllers/task.controller.js';

const router = Router();

// Render tasks page
router.get('/tasks', verifyUser, renderTasksPage);

// API routes
router.get('/api/v1/tasks', verifyUser, getTasks);
router.post('/api/v1/tasks', verifyUser, createTask);
router.put('/api/v1/tasks/:id', verifyUser, updateTask);
router.delete('/api/v1/tasks/:id', verifyUser, deleteTask);
router.get('/api/v1/tasks/stats', verifyUser, getTaskStats);

export default router;

