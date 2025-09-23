const mongoose = require("mongoose");

const AdminSchema = new mongoose.Schema({
    username: String,
    password: String,
    draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
});
  
module.exports = mongoose.model('Admin', AdminSchema);