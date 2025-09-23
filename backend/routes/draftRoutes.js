const express = require('express');
const Draft = require('../models/Draft');
const Faculty = require('../models/Faculty');
const Course = require('../models/Course');
const DomainConfig = require('../models/DomainConfig');
const Registration = require('../models/Registration');
const Admin = require('../models/Admin');
const router = express.Router();

// Create a new draft (and migrate existing data if this is the first draft)
router.post('/create', async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ message: 'Draft name required' });
    const existing = await Draft.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Draft already exists' });
    const draft = new Draft({ name });
    await draft.save();

    // If this is the first draft, migrate all existing data to this draft
    const draftCount = await Draft.countDocuments();
    if (draftCount === 1) {
      await Faculty.updateMany({}, { $set: { draftId: draft._id } });
      await Course.updateMany({}, { $set: { draftId: draft._id } });
      await DomainConfig.updateMany({}, { $set: { draftId: draft._id } });
      await Registration.updateMany({}, { $set: { draftId: draft._id } });
      await Admin.updateMany({}, { $set: { draftId: draft._id } });
    }
    res.status(201).json({ message: 'Draft created', draft });
  } catch (err) {
    res.status(500).json({ message: 'Error creating draft', error: err.message });
  }
});

// List all drafts
router.get('/list', async (req, res) => {
  try {
    const drafts = await Draft.find().sort({ createdAt: 1 });
    res.json(drafts);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching drafts', error: err.message });
  }
});

module.exports = router;
