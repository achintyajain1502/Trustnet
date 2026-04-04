const mongoose = require("mongoose");

const NavigationSchema = new mongoose.Schema({
  title: String,
  link: String,
  order: Number
});

module.exports = mongoose.model("Navigation", NavigationSchema);
