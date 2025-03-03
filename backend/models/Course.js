const mongoose = require("mongoose");


const CourseSchema = new mongoose.Schema({
    courseName: String,
    courseId: String,
    domain: String,
    courseType: { type: String, required: true, default: "Undefined" }  
  });
  
  module.exports = mongoose.model('Course', CourseSchema);
  