const express = require('express');
const Faculty = require('../models/Faculty');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Faculty route works' });
});

// ✅ Register a new faculty (Prevents duplicate registration)
router.post('/register', async (req, res) => {
  const { name, empId, selectedCourses = [], draftId } = req.body;
  const Course = require('../models/Course');

  try {
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    // ✅ Check if faculty already exists in this draft
    const existingFaculty = await Faculty.findOne({ empId, draftId });
    if (existingFaculty) {
      return res.status(400).json({ message: 'You have already registered.' });
    }

    // ✅ Ensure required fields are present
    if (!name || !empId) {
      return res.status(400).json({ message: 'Name and Employee ID are required.' });
    }


    // Check maxRegistrations for each selected course in this draft
    for (const course of selectedCourses) {
      const courseDoc = await Course.findOne({ courseId: course.courseId, draftId });
      if (!courseDoc) {
        return res.status(400).json({ message: `Course not found: ${course.courseName}` });
      }
      // If maxRegistrations > 0, enforce limit; if 0, treat as unlimited
      if (courseDoc.maxRegistrations > 0) {
        const count = await Faculty.countDocuments({ 'selectedCourses.courseId': course.courseId, draftId });
        if (count >= courseDoc.maxRegistrations) {
          return res.status(400).json({ message: `Registration full for course: ${course.courseName}` });
        }
      }
      // If maxRegistrations is 0, allow unlimited registrations (do nothing)
    }

  // ✅ Create new faculty entry
  const faculty = new Faculty({ name, empId, selectedCourses, draftId });
    await faculty.save();
    res.status(201).json({ message: 'Faculty registered successfully.', faculty });

  } catch (error) {
    console.error("Error registering faculty:", error);
    res.status(500).json({ message: 'Error registering faculty', error });
  }
});

// ✅ Get all faculty records
router.get('/', async (req, res) => {
  try {
    const { draftId } = req.query;
    if (!draftId) return res.status(400).json({ message: 'draftId required' });
    const faculties = await Faculty.find({ draftId });
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty', error });
  }
});

// ✅ Submit selected courses for a faculty
// ✅ Submit selected courses for a faculty

// Accept willingness in the request body
router.post('/submit-courses', async (req, res) => {
  let { empId, name, selectedCourses, draftId, willingness } = req.body;

  console.log("[DEBUG] Received course submission request:", req.body);
  console.log("[DEBUG] empId:", empId);
  console.log("[DEBUG] name:", name);
  console.log("[DEBUG] selectedCourses:", selectedCourses);
  console.log("[DEBUG] draftId:", draftId);
  console.log("[DEBUG] willingness:", willingness);

  // All validation checks removed as per user request. Allow all submissions to proceed.

  // ✅ Ensure `courseType` exists in each selected course
  selectedCourses = selectedCourses.map(course => ({
    ...course,
    courseType: course.courseType?.trim() || "Undefined" // ✅ Prevent missing `courseType`
  }));

  try {
    const Course = require('../models/Course');
  let faculty = await Faculty.findOne({ empId, draftId });

    // Check maxRegistrations for each selected course
    for (const course of selectedCourses) {
      const courseDoc = await Course.findOne({ courseId: course.courseId, draftId });
      if (!courseDoc) {
        return res.status(400).json({ message: `Course not found: ${course.courseName}` });
      }
      // If maxRegistrations > 0, enforce limit; if 0, treat as unlimited
      if (courseDoc.maxRegistrations > 0) {
        const alreadyRegistered = faculty && faculty.selectedCourses.some(c => c.courseId === course.courseId);
        if (!alreadyRegistered) {
          const count = await Faculty.countDocuments({ 'selectedCourses.courseId': course.courseId, draftId });
          if (count >= courseDoc.maxRegistrations) {
            return res.status(400).json({ message: `Registration full for course: ${course.courseName}` });
          }
        }
      }
      // If maxRegistrations is 0, allow unlimited registrations (do nothing)
    }

    if (!faculty) {
      console.log(`Faculty not found for empId: ${empId} in draft: ${draftId}, registering new faculty...`);

        faculty = new Faculty({
          name,
          empId,
          selectedCourses,
          willingness: willingness, // Store willingness as sent (true/false)
          submittedAt: new Date(),
          draftId
        });

      await faculty.save();
      console.log("✅ New faculty registered:", faculty);
      return res.status(201).json({ message: "New faculty registered and courses saved", faculty });
    }

    // ✅ If faculty exists, update their selected courses

  faculty.selectedCourses = selectedCourses;
  faculty.willingness = willingness;
  faculty.submittedAt = new Date(); 
  await faculty.save();

    console.log("✅ Courses updated successfully for:", empId);
    res.status(200).json({ message: 'Courses updated successfully', faculty });

  } catch (error) {
    console.error("❌ Error saving courses:", error);
    res.status(500).json({ message: 'Error saving courses', error });
  }
});


// ✅ Check if an employee ID is already registered
router.get('/check/:empId', async (req, res) => {
  const empId = req.params.empId; // ✅ Keep it as a string

  const { draftId } = req.query;
  if (!draftId) return res.status(400).json({ message: 'draftId required' });
  try {
    const faculty = await Faculty.findOne({ empId, draftId });
    if (faculty) {
      return res.json({ exists: true, faculty });
    }
    res.json({ exists: false });
  } catch (error) {
    console.error("❌ Error checking faculty ID:", error);
    res.status(500).json({ message: 'Error checking faculty ID', error });
  }
});

// ✅ Delete a faculty entry by empId
router.delete('/delete/:empId', async (req, res) => {
  const { empId } = req.params;

  const { draftId } = req.query;
  if (!draftId) return res.status(400).json({ message: 'draftId required' });
  try {
    const faculty = await Faculty.findOneAndDelete({ empId, draftId });
    if (!faculty) {
      return res.status(404).json({ message: "Faculty not found" });
    }
    res.json({ message: "Faculty deleted successfully" });
  } catch (error) {
    console.error("❌ Error deleting faculty:", error);
    res.status(500).json({ message: "Error deleting faculty", error });
  }
});




// store   pg:{ type: String },
// ug:{ type: String},
// pgspecialization:{ type: String},
// ugspecialization:{ type: String },
// researchdomain:{ type: String },

router.post("/storeugpg", async (req, res) => {
  const { empId, pgspecialization, ugspecialization, researchDomain, draftId } = req.body;
  if (!draftId) return res.status(400).json({ message: 'draftId required' });
  try {
    let faculty = await Faculty.findOne({ empId, draftId });
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty not found' });
    }
    faculty.pgspecialization = pgspecialization;
    faculty.ugspecialization = ugspecialization;
    faculty.researchdomain = researchDomain;
    await faculty.save();
    res.status(200).json({ message: 'Data saved successfully', faculty });
  } catch (error) {
    console.error("Error saving data:", error);
    res.status(500).json({ message: 'Error saving data', error });
  }
});
  

module.exports = router;
