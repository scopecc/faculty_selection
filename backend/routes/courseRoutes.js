const express = require("express");
const router = express.Router();
const Course = require("../models/Course"); // Import Course model

// Update maxRegistrations for a course
router.put('/set-max/:courseId', async (req, res) => {
  const { courseId } = req.params;
  const { maxRegistrations } = req.body;
  console.log('DEBUG: Received set-max for courseId:', courseId);
  if (typeof maxRegistrations !== 'number' || maxRegistrations < 0) {
    return res.status(400).json({ message: 'maxRegistrations must be a non-negative number' });
  }
  try {
    // Log all courseIds in DB for debugging
    const allCourses = await Course.find({}, { courseId: 1, _id: 0 });
    console.log('DEBUG: All courseIds in DB:', allCourses.map(c => c.courseId));
    const course = await Course.findOneAndUpdate(
      { courseId },
      { $set: { maxRegistrations } },
      { new: true }
    );
    if (!course) {
      console.log('DEBUG: No course found for courseId:', courseId);
      return res.status(404).json({ message: 'Course not found' });
    }
    res.json({ message: 'Max registrations updated', course });
  } catch (error) {
    res.status(500).json({ message: 'Error updating max registrations', error });
  }
});

// ✅ Route to store uploaded courses in MongoDB
router.post("/upload-courses", async (req, res) => {
  try {
    const courses = req.body;

    if (!Array.isArray(courses) || courses.length === 0) {
      return res.status(400).json({ message: "Invalid course data" });
    }

    // ✅ Ensure each course has `courseType`
    const formattedCourses = courses.map(course => ({
      ...course,
      courseType: course.courseType?.trim() || "Undefined",
    }));
    await Course.deleteMany({});
    // Insert into MongoDB
    await Course.insertMany(formattedCourses, { ordered: false }).catch(err => {
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
