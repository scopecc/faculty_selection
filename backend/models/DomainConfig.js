const mongoose = require("mongoose");

const domainConfigSchema = new mongoose.Schema({
  domain: { type: String, unique: true },
  minCount: Number,
  maxCount: Number,
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
});

module.exports = mongoose.model("DomainConfig", domainConfigSchema);
