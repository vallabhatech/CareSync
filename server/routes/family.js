const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const FamilyMember = require('../models/FamilyMember');
const authMiddleware = require('../middleware/authMiddleware');

// Maximum family members a single user may track. Keeps the profile UI
// manageable and bounds per-user storage.
const MAX_FAMILY_MEMBERS = 20;

// Whitelist of fields a client may set/update, so unexpected body keys
// (e.g. `user`, `_id`) can never be injected into a document.
const EDITABLE_FIELDS = [
  'name',
  'relationship',
  'dateOfBirth',
  'gender',
  'bloodGroup',
  'allergies',
  'conditions',
  'notes',
  'linkedUserId',
];

// Build a sanitised update object from the request body. Only whitelisted
// keys that are actually present are copied; `dateOfBirth` is coerced to a
// Date (or null), and empty `linkedUserId` is normalised to null.
function pickFields(body) {
  const out = {};
  for (const key of EDITABLE_FIELDS) {
    if (body[key] === undefined) continue;
    if (key === 'dateOfBirth') {
      out.dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : null;
    } else if (key === 'linkedUserId') {
      out.linkedUserId =
        body.linkedUserId && mongoose.Types.ObjectId.isValid(body.linkedUserId)
          ? body.linkedUserId
          : null;
    } else {
      out[key] = body[key];
    }
  }
  return out;
}

// GET /api/family — list all family members for the current user.
router.get('/', authMiddleware, async (req, res) => {
  try {
    const members = await FamilyMember.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(members);
  } catch (err) {
    console.error('Error fetching family members:', err);
    res.status(500).json({ message: 'Failed to fetch family members' });
  }
});

// POST /api/family — add a new family member (name required; max enforced).
router.post('/', authMiddleware, async (req, res) => {
  try {
    const fields = pickFields(req.body);

    if (!fields.name || !fields.name.trim()) {
      return res.status(400).json({ message: 'Name is required' });
    }

    const count = await FamilyMember.countDocuments({ user: req.user.id });
    if (count >= MAX_FAMILY_MEMBERS) {
      return res
        .status(400)
        .json({ message: `You can add up to ${MAX_FAMILY_MEMBERS} family members` });
    }

    const member = new FamilyMember({ ...fields, user: req.user.id });
    await member.save();
    res.status(201).json(member);
  } catch (err) {
    console.error('Error creating family member:', err);
    res.status(500).json({ message: 'Failed to create family member' });
  }
});

// PUT /api/family/:id — update a family member the user owns.
router.put('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found' });
    }
    if (member.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    const fields = pickFields(req.body);
    if (fields.name !== undefined && !String(fields.name).trim()) {
      return res.status(400).json({ message: 'Name cannot be empty' });
    }
    Object.assign(member, fields);

    await member.save();
    res.json(member);
  } catch (err) {
    console.error('Error updating family member:', err);
    res.status(500).json({ message: 'Failed to update family member' });
  }
});

// DELETE /api/family/:id — remove a family member the user owns.
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(404).json({ message: 'Family member not found' });
    }

    const member = await FamilyMember.findById(req.params.id);
    if (!member) {
      return res.status(404).json({ message: 'Family member not found' });
    }
    if (member.user.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Unauthorized' });
    }

    await FamilyMember.findByIdAndDelete(req.params.id);
    res.json({ message: 'Family member deleted' });
  } catch (err) {
    console.error('Error deleting family member:', err);
    res.status(500).json({ message: 'Failed to delete family member' });
  }
});

module.exports = router;
