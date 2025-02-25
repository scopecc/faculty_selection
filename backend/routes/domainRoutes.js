const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const DomainConfig = require("../models/DomainConfig");

// ✅ Insert courses.json data (One-time operation)
router.post("/insert-courses", async (req, res) => {
  try {
    const courses = req.body; // JSON data sent from frontend
    await Course.insertMany(courses);
    
    // Extract unique domains & set default min/max counts
    const uniqueDomains = [...new Set(courses.map(course => course.domain))];

    const domainConfigs = uniqueDomains.map(domain => ({
      domain,
      minCount: 1,  // Default min count
      maxCount: 5   // Default max count
    }));

    await DomainConfig.insertMany(domainConfigs, { ordered: false }).catch(err => {}); // Ignore duplicates
    res.json({ message: "Courses inserted successfully!" });
  } catch (error) {
    console.error("Error inserting courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch domain constraints
router.get("/domain-config", async (req, res) => {
  try {
    const configs = await DomainConfig.find();
    res.json(configs);
  } catch (error) {
    console.error("Error fetching domain constraints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Update domain constraints
router.post("/save", async (req, res) => {
  try {
    const { domainConfigs } = req.body;
    for (const config of domainConfigs) {
      await DomainConfig.updateOne(
        { domain: config.domain },
        { $set: { minCount: config.minCount, maxCount: config.maxCount } },
        { upsert: true }
      );
    }
    res.json({ message: "Domain constraints updated successfully!" });
  } catch (error) {
    console.error("Error updating domain constraints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
