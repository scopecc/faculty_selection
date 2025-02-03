const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: Number, required: true, unique: true },
  preference: { type: String, required: true },
  selectedCourses: [{
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    type: { type: String, required: true },
    domain: { type: String, required: true }
  }]
});

const Faculty = mongoose.model('Faculty', FacultySchema);
module.exports = Faculty;
