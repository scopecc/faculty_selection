const express = require("express");
const router = express.Router();
const Course = require("../models/Course"); // Import Course model

// ✅ Route to store uploaded courses in MongoDB
router.post("/upload-courses", async (req, res) => {
  try {
    const courses = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: "Invalid course data" });
    }

    // Insert courses into MongoDB, ignoring duplicates
    await Course.insertMany(courses, { ordered: false }).catch(err => {
      console.error("Duplicate courses detected:", err.message);
    });

    res.status(201).json({ message: "✅ Courses uploaded successfully!" });
  } catch (error) {
    console.error("❌ Error uploading courses:", error);
    res.status(500).json({ message: "Internal server error" });
  }
});

router.get("/", async (req, res) => {
    try {
      const courses = await Course.find();
      res.json(courses);
    } catch (error) {
      console.error("Error fetching courses:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });
   

module.exports = router;
