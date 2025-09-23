const mongoose = require("mongoose")

const RegistrationSchema = new mongoose.Schema({
    status:String,
    draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
})

module.exports = mongoose.model('Registration', RegistrationSchema);