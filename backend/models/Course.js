const mongoose = require("mongoose");


const CourseSchema = new mongoose.Schema({
  courseName: String,
  courseId: String,
  domain: String,
  courseType: { type: String, required: true, default: "Undefined" },
  maxRegistrations: { type: Number, required: false, default: 0 } // 0 means unlimited
});

module.exports = mongoose.model('Course', CourseSchema);
  