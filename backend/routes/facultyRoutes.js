const express = require('express');
const Faculty = require('../models/Faculty');
const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ message: 'Faculty route works' });
});

// ✅ Register a new faculty (Prevents duplicate registration)
router.post('/register', async (req, res) => {
  const { name, empId, preference, selectedCourses = [] } = req.body;

  try {
    // ✅ Check if faculty already exists
    const existingFaculty = await Faculty.findOne({ empId });
    if (existingFaculty) {
      return res.status(400).json({ message: 'You have already registered.' });
    }

    // ✅ Ensure required fields are present
    if (!name || !empId || !preference) {
      return res.status(400).json({ message: 'Name, Employee ID, and Preference are required.' });
    }

    // ✅ Create new faculty entry
    const faculty = new Faculty({ name, empId, preference, selectedCourses });
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
    const faculties = await Faculty.find();
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty', error });
  }
});

// ✅ Submit selected courses for a faculty
// ✅ Submit selected courses for a faculty
router.post('/submit-courses', async (req, res) => {
  let { empId, facultyName, preference, selectedCourses } = req.body;

  console.log("Received course submission request:", req.body);

  // ✅ Validate required fields
  if (!facultyName || !empId || !preference || !Array.isArray(selectedCourses)) {
    console.error("Invalid data received:", req.body);
    return res.status(400).json({ message: "Invalid request. Ensure name, empId, preference, and courses are provided correctly." });
  }

  // ✅ Ensure `courseType` exists in each selected course
  selectedCourses = selectedCourses.map(course => ({
    ...course,
    courseType: course.courseType?.trim() || "Undefined" // ✅ Prevent missing `courseType`
  }));

  try {
    let faculty = await Faculty.findOne({ empId });

    if (!faculty) {
      console.log(`Faculty not found for empId: ${empId}, registering new faculty...`);

      faculty = new Faculty({
        name: facultyName,
        empId,
        preference,
        selectedCourses,
        submittedAt: new Date()
      });

      await faculty.save();
      console.log("✅ New faculty registered:", faculty);
      return res.status(201).json({ message: "New faculty registered and courses saved", faculty });
    }

    // ✅ If faculty exists, update their selected courses
    faculty.selectedCourses = selectedCourses;
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

  try {
    const faculty = await Faculty.findOne({ empId });

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

  try {
    const faculty = await Faculty.findOneAndDelete({ empId });

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
  const { empId, pgspecialization, ugspecialization, researchDomain } = req.body;
  try {
    let faculty = await Faculty.findOne({ empId });
    if (!faculty) {
      return res.status(400).json({ message: 'Faculty not found' });
    }
    // faculty.pg = pg;
    // faculty.ug = ug;
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
