const mongoose = require("mongoose");


const domainConfigSchema = new mongoose.Schema({
  domain: { type: String },
  minCount: Number,
  maxCount: Number,
  draftId: { type: mongoose.Schema.Types.ObjectId, ref: 'Draft', required: false }
});

// Compound unique index for (domain, draftId)
domainConfigSchema.index({ domain: 1, draftId: 1 }, { unique: true });

module.exports = mongoose.model("DomainConfig", domainConfigSchema);
