const mongoose = require("mongoose");

const tabSectionSchema = new mongoose.Schema({
  tabName: String,
  headline: String,
  content: String,
  image: String,
  order: Number
});

module.exports = mongoose.model("TabSection", tabSectionSchema);
