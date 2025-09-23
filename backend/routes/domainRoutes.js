const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const Course = require("../models/Course");
const DomainConfig = require("../models/DomainConfig");

// ✅ Insert courses.json data (One-time operation)
router.post("/insert-courses", async (req, res) => {
  try {
    const { courses, draftId } = req.body;
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    await Course.insertMany(courses.map(c => ({ ...c, draftId })));
    // Extract unique domains & set default min/max counts
    const uniqueDomains = [...new Set(courses.map(course => course.domain))];
    const domainConfigs = uniqueDomains.map(domain => ({
      domain,
      minCount: 0,
      maxCount: 2,
      draftId
    }));
    await DomainConfig.insertMany(domainConfigs, { ordered: false }).catch(err => {}); // Ignore duplicates
    res.json({ message: "Courses inserted successfully!" });
  } catch (error) {
    console.error("Error inserting courses:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Fetch domain constraints
router.get("/", async (req, res) => {
  try {
    const { draftId } = req.query;
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    const configs = await DomainConfig.find({ draftId });
    res.json(configs);
  } catch (error) {
    console.error("Error fetching domain constraints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

// ✅ Update domain constraints
router.post("/save", async (req, res) => {
  try {
    const { domainConfigs, draftId } = req.body;
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    for (const config of domainConfigs) {
      await DomainConfig.updateOne(
        { domain: config.domain, draftId },
        { $set: { minCount: config.minCount, maxCount: config.maxCount, draftId } },
        { upsert: true }
      );
    }
    res.json({ message: "Domain constraints updated successfully!" });
  } catch (error) {
    console.error("Error updating domain constraints:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

router.get("/domains", async (req, res) => {
  try {
    const { draftId } = req.query;
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    const domains = await Course.distinct("domain", { draftId });
    console.log("✅ Fetched Domains:", domains);
    res.json(domains);
  } catch (error) {
    console.error("❌ Error fetching domains:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

module.exports = router;
