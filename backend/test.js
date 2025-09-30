// debugCourseIds.js
const mongoose = require('mongoose');

// Update these with your actual values
MONGO_URI="mongodb+srv://smverappan:Deivanai77@verappansm.tsywc.mongodb.net/facultyDB"
const draftId = '68d28f378c60e2169c1bcf10'; // <-- set your draftId

// Replace this array with the courseIds you are submitting from the frontend
const frontendCourseIds = [
  "BACSE103",
  "BECM302E",
  "SWE2017",
  "BCSE304L",
  "BCSE415L",
  "BCSE406L",
  "CSE4067"
];

const Course = require('./models/Course'); // Adjust path if needed

async function main() {
  await mongoose.connect(MONGO_URI);

  // Get all courseIds for this draftId in the backend
  const backendCourses = await Course.find({ draftId });
  const backendCourseIds = backendCourses.map(c => c.courseId.trim());

  console.log('Backend courseIds:', backendCourseIds);
  console.log('Frontend courseIds:', frontendCourseIds);

  // Find missing courseIds
  const missing = frontendCourseIds.filter(id => !backendCourseIds.includes(id.trim()));
  if (missing.length === 0) {
    console.log('All frontend courseIds exist in backend!');
  } else {
    console.log('Missing in backend:', missing);
  }

  await mongoose.disconnect();
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});