const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const DomainConfig = require("../models/DomainConfig");

// ✅ Insert courses.json data (One-time operation)
router.post("/insert-courses", async (req, res) => {
  try {
    const courses = req.body;

    // ✅ Ensure courses array is valid
    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ error: "Invalid courses data" });
    }

    // ✅ Insert new courses (Ignore duplicates)
    await Course.insertMany(courses, { ordered: false }).catch((err) => {
      console.warn("⚠️ Some duplicate courses were skipped:", err.message);
    });

    // ✅ Fetch unique domains from MongoDB (Avoid duplicates)
    const uniqueDomains = await Course.distinct("domain");

    // ✅ Prepare default domain constraints
    const domainConfigs = uniqueDomains.map((domain) => ({
      domain,
      minCount: 1,
      maxCount: 5,
    }));

    // ✅ Insert domain constraints (Ignore duplicates)
    await DomainConfig.insertMany(domainConfigs, { ordered: false }).catch((err) => {
      console.warn("⚠️ Some domain constraints already exist:", err.message);
    });

    res.json({ message: "✅ Courses & domain constraints inserted successfully!" });

  } catch (error) {
    console.error("❌ Error inserting courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});


// ✅ Fetch domain constraints
router.get("/", async (req, res) => {
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
