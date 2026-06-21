const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const User = require('../models/User');
const authMiddleware = require('../middleware/authMiddleware');

const MAX_CONTACTS = 3;
const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

// All emergency-contact routes require authentication.
router.use(authMiddleware);

// @route   GET /api/auth/emergency-contacts
// @desc    List the authenticated user's emergency contacts
// @access  Private
router.get('/', async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('emergencyContacts');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ emergencyContacts: user.emergencyContacts || [] });
  } catch (err) {
    console.error('Fetch emergency contacts error:', err.message);
    res.status(500).json({ message: 'Server error fetching emergency contacts' });
  }
});

// @route   POST /api/auth/emergency-contacts
// @desc    Add a new emergency contact (max 3)
// @access  Private
router.post('/', async (req, res) => {
  const name = String(req.body.name || '').trim();
  const relationship = String(req.body.relationship || '').trim();
  const phone = String(req.body.phone || '').trim();
  const email = String(req.body.email || '').trim().toLowerCase();
  const isPrimary = req.body.isPrimary === true || req.body.isPrimary === 'true';

  try {
    if (!name || !phone) {
      return res.status(400).json({ message: 'Name and phone are required' });
    }
    if (email && !emailRegex.test(email)) {
      return res.status(400).json({ message: 'Invalid email address' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.emergencyContacts.length >= MAX_CONTACTS) {
      return res.status(400).json({ message: `You can store at most ${MAX_CONTACTS} emergency contacts` });
    }

    // First contact is always primary; an explicit isPrimary clears the others.
    const makePrimary = isPrimary || user.emergencyContacts.length === 0;
    if (makePrimary) {
      user.emergencyContacts.forEach((c) => { c.isPrimary = false; });
    }

    user.emergencyContacts.push({ name, relationship, phone, email, isPrimary: makePrimary });
    await user.save();

    res.status(201).json({ emergencyContacts: user.emergencyContacts });
  } catch (err) {
    console.error('Add emergency contact error:', err.message);
    res.status(500).json({ message: 'Server error adding emergency contact' });
  }
});

// @route   PUT /api/auth/emergency-contacts/:id
// @desc    Update an existing emergency contact
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const contact = user.emergencyContacts.id(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    if (req.body.name !== undefined) {
      const name = String(req.body.name).trim();
      if (!name) {
        return res.status(400).json({ message: 'Name cannot be empty' });
      }
      contact.name = name;
    }
    if (req.body.phone !== undefined) {
      const phone = String(req.body.phone).trim();
      if (!phone) {
        return res.status(400).json({ message: 'Phone cannot be empty' });
      }
      contact.phone = phone;
    }
    if (req.body.relationship !== undefined) {
      contact.relationship = String(req.body.relationship).trim();
    }
    if (req.body.email !== undefined) {
      const email = String(req.body.email).trim().toLowerCase();
      if (email && !emailRegex.test(email)) {
        return res.status(400).json({ message: 'Invalid email address' });
      }
      contact.email = email;
    }
    if (req.body.isPrimary !== undefined && (req.body.isPrimary === true || req.body.isPrimary === 'true')) {
      user.emergencyContacts.forEach((c) => { c.isPrimary = false; });
      contact.isPrimary = true;
    }

    await user.save();
    res.json({ emergencyContacts: user.emergencyContacts });
  } catch (err) {
    console.error('Update emergency contact error:', err.message);
    res.status(500).json({ message: 'Server error updating emergency contact' });
  }
});

// @route   DELETE /api/auth/emergency-contacts/:id
// @desc    Remove an emergency contact
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const contact = user.emergencyContacts.id(req.params.id);
    if (!contact) {
      return res.status(404).json({ message: 'Emergency contact not found' });
    }

    const wasPrimary = contact.isPrimary;
    user.emergencyContacts.pull(req.params.id);

    // If the primary was removed and contacts remain, promote the first one.
    if (wasPrimary && user.emergencyContacts.length > 0) {
      user.emergencyContacts[0].isPrimary = true;
    }

    await user.save();
    res.json({ emergencyContacts: user.emergencyContacts });
  } catch (err) {
    console.error('Delete emergency contact error:', err.message);
    res.status(500).json({ message: 'Server error deleting emergency contact' });
  }
});

module.exports = router;
