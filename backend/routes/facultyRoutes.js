// backend/routes/facultyRoutes.js
const express = require('express');
const Faculty = require('../models/Faculty');
const router = express.Router();

// Register a new faculty
router.post('/register', async (req, res) => {
  const { name, empId, preference, selectedCourses = [] } = req.body;
  try {
    const faculty = new Faculty({ name, empId, preference, selectedCourses });
    await faculty.save();
    res.status(201).json(faculty);
  } catch (error) {
    res.status(500).json({ message: 'Error registering faculty', error });
  }
});

// Get all faculty records
router.get('/', async (req, res) => {
  try {
    const faculties = await Faculty.find();
    res.json(faculties);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching faculty', error });
  }
});

// Submit selected courses for a faculty
router.post('/submit-courses', async (req, res) => {
  let { empId, selectedCourses } = req.body;

  console.log("Received course submission request:", req.body);

  try {
    const faculty = await Faculty.findOne({ empId });

    if (!faculty) {
      console.error("Faculty not found for empId:", empId);
      return res.status(404).json({ message: 'Faculty not found' });
    }

    // Ensure selectedCourses is an array
    if (!Array.isArray(selectedCourses)) {
      console.error("Invalid selectedCourses format:", selectedCourses);
      return res.status(400).json({ message: "Invalid data format for selectedCourses" });
    }

    faculty.selectedCourses = selectedCourses; // Store as an array of objects
    await faculty.save();

    console.log("Courses saved successfully for:", empId);
    res.status(200).json({ message: 'Courses saved successfully', faculty });

  } catch (error) {
    console.error("Error saving courses:", error);
    res.status(500).json({ message: 'Error saving courses', error });
  }
});

// Check if an employee ID is already registered
router.get('/check/:empId', async (req, res) => {
  const empId = parseInt(req.params.empId, 10);
  
  try {
    const faculty = await Faculty.findOne({ empId });
    if (faculty) {
      return res.json({ exists: true });
    }
    res.json({ exists: false });
  } catch (error) {
    res.status(500).json({ message: 'Error checking faculty ID', error });
  }
});



module.exports = router;