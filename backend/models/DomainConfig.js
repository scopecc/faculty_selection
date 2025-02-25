const mongoose = require("mongoose");

const domainConfigSchema = new mongoose.Schema({
  domain: { type: String, unique: true },
  minCount: Number,
  maxCount: Number
});

module.exports = mongoose.model("DomainConfig", domainConfigSchema);
