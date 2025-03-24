const mongoose = require("mongoose")

const RegistrationSchema = new mongoose.Schema({
    status:String
})

module.exports = mongoose.model('Registration', RegistrationSchema);