const express = require('express');
const router = express.Router();
const DomainConfig = require('../models/DomainConfig');

// ✅ Fetch all domain configurations
router.get('/', async (req, res) => {
  try {
    const configs = await DomainConfig.find();
    res.json(configs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching domain constraints', error });
  }
});

// ✅ Save or Update domain constraints
router.post('/save', async (req, res) => {
  const { domainConfigs } = req.body;  // Expecting an array of domain objects

  try {
    for (const config of domainConfigs) {
      await DomainConfig.findOneAndUpdate(
        { domain: config.domain },
        { minCount: config.minCount, maxCount: config.maxCount },
        { upsert: true, new: true }
      );
    }
    res.status(200).json({ message: 'Domain constraints updated successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error updating domain constraints', error });
  }
});

module.exports = router;
