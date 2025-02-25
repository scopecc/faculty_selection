const mongoose = require('mongoose');

const DomainConfigSchema = new mongoose.Schema({
  domain: { type: String, required: true, unique: true },
  minCount: { type: Number, required: true },
  maxCount: { type: Number, required: true }
});

module.exports = mongoose.model('DomainConfig', DomainConfigSchema);
