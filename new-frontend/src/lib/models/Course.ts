import mongoose from "mongoose";

const CourseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true },
    courseName: { type: String, required: true },
    type: { type: String, enum: ["UG", "PG"], required: true, default: "UG" },
    credits: { type: Number, required: true, default: 3 },
    department: { type: String, required: false },
    semester: { type: String, required: false },
    facultyEmpId: { type: String, required: false }, // Assigned faculty
    facultyName: { type: String, required: false }, // Assigned faculty name
    maxRegistrations: { type: Number, required: false, default: 1 },
  },
  {
    timestamps: true,
  }
);

const Course = mongoose.models.Course || mongoose.model("Course", CourseSchema);
export default Course;
