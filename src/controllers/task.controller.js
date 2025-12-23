// src/controllers/task.controller.js
import { Task } from '../models/Task.js';
import { Customer } from '../models/Customer.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';
import { getUserPlan } from '../utils/plan.util.js';
import { autoLogEvent } from './note.controller.js';

// Render tasks page
export const renderTasksPage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      avatar: req.user.avatar || req.user.avatarUrl || null,
      plan: req.user.plan || null,
    };

    res.render('tasks', {
      title: 'Tasks & Follow-ups',
      user,
      activePage: 'tasks'
    });
  } catch (error) {
    console.error('Error rendering tasks page:', error);
    res.status(500).send('Failed to load tasks page');
  }
};

// Get tasks with filters (Today, Overdue, Upcoming)
export const getTasks = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { filter = 'all', status, customerId } = req.query;

    // Check plan restrictions for Free Trial users
    const userPlan = await getUserPlan(userId);
    const isFreeTrial = !userPlan || userPlan.slug === 'free-trial';

    // Build where clause
    const where = {
      userId,
      status: status || { [Op.in]: ['pending', 'done'] }
    };

    if (customerId) {
      where.customerId = customerId;
    }

    // Apply date filters
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    if (filter === 'today') {
      where.dueDate = {
        [Op.gte]: todayStart,
        [Op.lt]: todayEnd
      };
    } else if (filter === 'overdue') {
      where.dueDate = {
        [Op.lt]: todayStart
      };
      where.status = 'pending'; // Only show pending overdue tasks
    } else if (filter === 'upcoming') {
      where.dueDate = {
        [Op.gte]: todayEnd
      };
    }

    // Get tasks with customer info
    const tasks = await Task.findAll({
      where,
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phoneE164', 'email']
      }],
      order: [
        ['dueDate', 'ASC'],
        ['priority', 'DESC']
      ]
    });

    // Apply Free Trial limit (max 10 tasks)
    let filteredTasks = tasks;
    if (isFreeTrial && filter === 'all') {
      filteredTasks = tasks.slice(0, 10);
    }

    return res.status(200).json(
      new ApiResponse(200, {
        tasks: filteredTasks,
        total: tasks.length,
        isFreeTrial,
        limit: isFreeTrial ? 10 : null
      }, 'Tasks fetched successfully')
    );

  } catch (error) {
    console.error('Error fetching tasks:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch tasks',
      error: error.message
    });
  }
});

// Create new task
export const createTask = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId, title, description, type, dueDate, reminderDate, priority } = req.body;

    if (!customerId || !title || !dueDate) {
      return res.status(400).json({
        success: false,
        message: 'Customer ID, title, and due date are required'
      });
    }

    // Check plan restrictions
    const userPlan = await getUserPlan(userId);
    const isFreeTrial = !userPlan || userPlan.slug === 'free-trial';

    if (isFreeTrial) {
      // Check task limit for Free Trial
      const taskCount = await Task.count({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'done'] }
        }
      });

      if (taskCount >= 10) {
        return res.status(403).json({
          success: false,
          message: 'Free Trial plan allows maximum 10 tasks. Upgrade to Silver or Gold for unlimited tasks.',
          upgradeRequired: true
        });
      }

      // Free Trial doesn't support reminders
      if (reminderDate) {
        return res.status(403).json({
          success: false,
          message: 'Reminders are not available in Free Trial plan. Upgrade to Silver or Gold for reminder features.',
          upgradeRequired: true
        });
      }
    }

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        userId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const task = await Task.create({
      userId,
      customerId,
      title,
      description: description || null,
      type: type || 'other',
      dueDate,
      reminderDate: reminderDate || null,
      priority: priority || 'medium',
      status: 'pending'
    });

    // Auto-log task creation event
    await autoLogEvent(
      userId,
      customerId,
      'task_created',
      'Task Created',
      `Task "${title}" created`,
      { taskId: task.id, type: type || 'other', priority: priority || 'medium', dueDate }
    );

    const taskWithCustomer = await Task.findByPk(task.id, {
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phoneE164', 'email']
      }]
    });

    return res.status(201).json(
      new ApiResponse(201, taskWithCustomer, 'Task created successfully')
    );

  } catch (error) {
    console.error('Error creating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create task',
      error: error.message
    });
  }
});

// Update task
export const updateTask = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, description, type, status, dueDate, reminderDate, priority } = req.body;

    const task = await Task.findOne({
      where: {
        id,
        userId
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    // Check plan restrictions for reminders
    const userPlan = await getUserPlan(userId);
    const isFreeTrial = !userPlan || userPlan.slug === 'free-trial';

    if (isFreeTrial && reminderDate) {
      return res.status(403).json({
        success: false,
        message: 'Reminders are not available in Free Trial plan. Upgrade to Silver or Gold for reminder features.',
        upgradeRequired: true
      });
    }

    // Check if status changed to 'done' for auto-logging
    const wasDone = task.status === 'done';
    const isNowDone = status === 'done' && task.status !== 'done';

    // Update task
    await task.update({
      title: title || task.title,
      description: description !== undefined ? description : task.description,
      type: type || task.type,
      status: status || task.status,
      dueDate: dueDate || task.dueDate,
      reminderDate: reminderDate !== undefined ? reminderDate : task.reminderDate,
      priority: priority || task.priority
    });

    // Auto-log task completion event
    if (isNowDone) {
      await autoLogEvent(
        userId,
        task.customerId,
        'task_completed',
        'Task Completed',
        `Task "${task.title}" marked as completed`,
        { taskId: task.id, type: task.type }
      );
    }

    const updatedTask = await Task.findByPk(task.id, {
      include: [{
        model: Customer,
        as: 'customer',
        attributes: ['id', 'name', 'phoneE164', 'email']
      }]
    });

    return res.status(200).json(
      new ApiResponse(200, updatedTask, 'Task updated successfully')
    );

  } catch (error) {
    console.error('Error updating task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update task',
      error: error.message
    });
  }
});

// Delete task
export const deleteTask = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const task = await Task.findOne({
      where: {
        id,
        userId
      }
    });

    if (!task) {
      return res.status(404).json({
        success: false,
        message: 'Task not found'
      });
    }

    await task.destroy();

    return res.status(200).json(
      new ApiResponse(200, null, 'Task deleted successfully')
    );

  } catch (error) {
    console.error('Error deleting task:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete task',
      error: error.message
    });
  }
});

// Get task statistics
export const getTaskStats = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayEnd = new Date(todayStart);
    todayEnd.setDate(todayEnd.getDate() + 1);

    const [today, overdue, upcoming, total] = await Promise.all([
      Task.count({
        where: {
          userId,
          status: 'pending',
          dueDate: {
            [Op.gte]: todayStart,
            [Op.lt]: todayEnd
          }
        }
      }),
      Task.count({
        where: {
          userId,
          status: 'pending',
          dueDate: {
            [Op.lt]: todayStart
          }
        }
      }),
      Task.count({
        where: {
          userId,
          status: 'pending',
          dueDate: {
            [Op.gte]: todayEnd
          }
        }
      }),
      Task.count({
        where: {
          userId,
          status: { [Op.in]: ['pending', 'done'] }
        }
      })
    ]);

    return res.status(200).json(
      new ApiResponse(200, {
        today,
        overdue,
        upcoming,
        total
      }, 'Task statistics fetched successfully')
    );

  } catch (error) {
    console.error('Error fetching task stats:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch task statistics',
      error: error.message
    });
  }
});

