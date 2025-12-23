// src/controllers/note.controller.js
import { Note } from '../models/Note.js';
import { Customer } from '../models/Customer.js';
import { User } from '../models/User.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { ApiResponse } from '../utils/ApiResponse.js';
import { Op } from 'sequelize';

// Render notes/timeline page
export const renderNotesPage = async (req, res) => {
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).redirect('/login');
    }

    const user = {
      firstName: req.user.firstName || '',
      lastName: req.user.lastName || '',
      plan: req.user.plan || null,
    };

    res.render('notes', {
      title: 'Notes & Timeline',
      user,
      activePage: 'notes'
    });
  } catch (error) {
    console.error('Error rendering notes page:', error);
    res.status(500).send('Failed to load notes page');
  }
};

// Get timeline for a specific customer
export const getCustomerTimeline = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId } = req.params;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        userId: userId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    // Get all timeline entries for this customer
    const notes = await Note.findAll({
      where: {
        userId: userId,
        customerId: customerId
      },
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ],
      order: [['createdAt', 'DESC']]
    });

    return res.status(200).json(
      new ApiResponse(200, notes, 'Timeline fetched successfully')
    );
  } catch (error) {
    console.error('Error fetching timeline:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch timeline',
      error: error.message
    });
  }
});

// Create a new note
export const createNote = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { customerId, title, content, type = 'note' } = req.body;

    // Verify customer belongs to user
    const customer = await Customer.findOne({
      where: {
        id: customerId,
        userId: userId
      }
    });

    if (!customer) {
      return res.status(404).json({
        success: false,
        message: 'Customer not found'
      });
    }

    const note = await Note.create({
      userId,
      customerId,
      type,
      title,
      content,
      createdBy: userId
    });

    // Fetch with creator info
    const noteWithCreator = await Note.findByPk(note.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    return res.status(201).json(
      new ApiResponse(201, noteWithCreator, 'Note created successfully')
    );
  } catch (error) {
    console.error('Error creating note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create note',
      error: error.message
    });
  }
});

// Update a note
export const updateNote = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { title, content } = req.body;

    const note = await Note.findOne({
      where: {
        id,
        userId,
        type: 'note', // Only allow updating manual notes
        createdBy: userId // Only creator can update
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to update it'
      });
    }

    note.title = title;
    note.content = content;
    await note.save();

    const updatedNote = await Note.findByPk(note.id, {
      include: [
        {
          model: User,
          as: 'creator',
          attributes: ['id', 'firstName', 'lastName', 'email'],
          required: false
        }
      ]
    });

    return res.status(200).json(
      new ApiResponse(200, updatedNote, 'Note updated successfully')
    );
  } catch (error) {
    console.error('Error updating note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update note',
      error: error.message
    });
  }
});

// Delete a note
export const deleteNote = asyncHandler(async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const note = await Note.findOne({
      where: {
        id,
        userId,
        type: 'note', // Only allow deleting manual notes
        createdBy: userId // Only creator can delete
      }
    });

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found or you do not have permission to delete it'
      });
    }

    await note.destroy();

    return res.status(200).json(
      new ApiResponse(200, null, 'Note deleted successfully')
    );
  } catch (error) {
    console.error('Error deleting note:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete note',
      error: error.message
    });
  }
});

// Auto-log an event (used by other controllers)
export const autoLogEvent = async (userId, customerId, type, title, content, metadata = null) => {
  try {
    await Note.create({
      userId,
      customerId,
      type,
      title,
      content,
      metadata,
      createdBy: null // Auto-logged events don't have a creator
    });
  } catch (error) {
    console.error('Error auto-logging event:', error);
    // Don't throw - we don't want to break the main flow
  }
};

