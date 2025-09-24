import mongoose from "mongoose";

const FacultySchema = new mongoose.Schema(
  {
    name: { type: String, required: false },
    empId: { type: String, required: true }, // Changed to String for better compatibility
    email: { type: String, required: true },
    preference: { type: String, enum: ["UG", "PG"], required: false },
    selectedCourses: [{ type: String }], // Array of course IDs
    submissionTime: { type: Date, required: false },
    clerkUserId: { type: String, required: false }, // Link to Clerk user
  },
  {
    timestamps: true,
  }
);

// Create compound index for empId uniqueness
FacultySchema.index({ empId: 1 }, { unique: true });

const Faculty =
  mongoose.models.Faculty || mongoose.model("Faculty", FacultySchema);
export default Faculty;
