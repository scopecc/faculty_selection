const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: Number, required: true, unique: true },
  preference: { type: String, required: true },
  selectedCourses: [{
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    courseType: { type: String, required: true },
    domain: { type: String, required: true }
  }],
  pg:{ type: String },
  ug:{ type: String},
  pgspecialization:{ type: String},
  ugspecialization:{ type: String },
  researchdomain:{ type: String },
});

const Faculty = mongoose.model('Faculty', FacultySchema);
module.exports = Faculty;
