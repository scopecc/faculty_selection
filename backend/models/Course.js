const mongoose = require("mongoose");


const CourseSchema = new mongoose.Schema({
  courseName: String,
  courseId: String,
  domain: String,
  courseType: { type: String, required: true, default: "Undefined" },
  maxRegistrations: { type: Number, required: false, default: 0 }, // 0 means unlimited
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
});

module.exports = mongoose.model('Course', CourseSchema);
  