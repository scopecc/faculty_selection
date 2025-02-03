const CourseSchema = new mongoose.Schema({
    courseName: String,
    courseId: String,
    domain: String,
    type: String, // Theory or Theory+Lab
  });
  
  module.exports = mongoose.model('Course', CourseSchema);
  