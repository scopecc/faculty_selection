const mongoose = require('mongoose');

const FacultySchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: Number, required: true },
  preference: { type: String, required: true },
  selectedCourses: [{
    courseId: { type: String, required: true },
    courseName: { type: String, required: true },
    courseType: { type: String, required: true },
    domain: { type: String, required: true }
  }],
  willingness: { type: Boolean, default: false }, // New field for willingness
  // pg:{ type: String },
  // ug:{ type: String},
  pgspecialization:{ type: String},
  ugspecialization:{ type: String },
  researchdomain:{ type: String },
  submittedAt: { type: Date },
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
});


// Compound unique index: empId + draftId
FacultySchema.index({ empId: 1, draftId: 1 }, { unique: true });

const Faculty = mongoose.model('Faculty', FacultySchema);
module.exports = Faculty;
