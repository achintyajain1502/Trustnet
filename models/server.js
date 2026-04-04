require("./db");
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");
const TabSection = require("./models/TabSection");

const app = express();
const PORT = 3000;

// ---------------- MIDDLEWARE ----------------
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ---------------- MULTER CONFIG ----------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ---------------- SCHEMAS ----------------
const dateSchema = new mongoose.Schema({ event: String, date: String });
const DateModel = mongoose.model("Date", dateSchema);

const speakerSchema = new mongoose.Schema({ name: String, affiliation: String, image: String });
const Speaker = mongoose.model("Speaker", speakerSchema);

const publisherSchema = new mongoose.Schema({ name: String, logo: String });
const Publisher = mongoose.model("Publisher", publisherSchema);

const partnerSchema = new mongoose.Schema({ name: String, logo: String });
const Partner = mongoose.model("Partner", partnerSchema);

// ---------------- API ROUTES ----------------

// GET all data
app.get("/api/dates", async (req, res) => res.json(await DateModel.find()));
app.get("/api/speakers", async (req, res) => res.json(await Speaker.find()));
app.get("/api/publishers", async (req, res) => res.json(await Publisher.find()));
app.get("/api/partners", async (req, res) => res.json(await Partner.find()));

// POST new data
app.post("/api/dates", async (req, res) => {
  const newDate = await DateModel.create(req.body);
  res.json(newDate);
});

app.post("/api/speakers", upload.single("image"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const newSpeaker = await Speaker.create({
    name: req.body.name,
    affiliation: req.body.affiliation,
    image: host + "/uploads/" + req.file.filename
  });
  res.json(newSpeaker);
});

app.post("/api/publishers", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const newPublisher = await Publisher.create({
    name: req.body.name,
    logo: host + "/uploads/" + req.file.filename
  });
  res.json(newPublisher);
});

app.post("/api/partners", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const newPartner = await Partner.create({
    name: req.body.name,
    logo: host + "/uploads/" + req.file.filename
  });
  res.json(newPartner);
});

// DELETE data
app.delete("/api/dates/:id", async (req, res) => {
  await DateModel.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted ✅" });
});
app.delete("/api/speakers/:id", async (req, res) => {
  await Speaker.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted ✅" });
});
app.delete("/api/publishers/:id", async (req, res) => {
  await Publisher.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted ✅" });
});
app.delete("/api/partners/:id", async (req, res) => {
  await Partner.findByIdAndDelete(req.params.id);
  res.json({ message: "Deleted ✅" });
});

// UPDATE data
app.put("/api/dates/:id", async (req, res) => {
  const updated = await DateModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});
app.put("/api/speakers/:id", upload.single("image"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const updateData = { name: req.body.name, affiliation: req.body.affiliation };
  if(req.file) updateData.image = host + "/uploads/" + req.file.filename;
  const updated = await Speaker.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});
app.put("/api/publishers/:id", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const updateData = { name: req.body.name };
  if(req.file) updateData.logo = host + "/uploads/" + req.file.filename;
  const updated = await Publisher.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});
app.put("/api/partners/:id", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  const updateData = { name: req.body.name };
  if(req.file) updateData.logo = host + "/uploads/" + req.file.filename;
  const updated = await Partner.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// Catch-all route
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ================= TAB SECTIONS =================

// GET all tabs
app.get("/api/tabs", async (req, res) => {
  const tabs = await TabSection.find().sort({ order: 1 });
  res.json(tabs);
});

// ADD new tab
app.post("/api/tabs", upload.single("image"), async (req, res) => {
  const count = await TabSection.countDocuments();
  const host = req.protocol + "://" + req.get("host");

  const newTab = await TabSection.create({
    tabName: req.body.tabName,
    headline: req.body.headline,
    content: req.body.content,
    image: req.file ? host + "/uploads/" + req.file.filename : "",
    order: count
  });

  res.json(newTab);
});

// DELETE tab
app.delete("/api/tabs/:id", async (req, res) => {
  await TabSection.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));

const Navigation = require("./models/Navigation");

// GET
app.get("/api/navigation", async (req,res)=>{
  res.json(await Navigation.find());
});

// POST
app.post("/api/navigation", async (req,res)=>{
  res.json(await Navigation.create(req.body));
});

// DELETE
app.delete("/api/navigation/:id", async (req,res)=>{
  await Navigation.findByIdAndDelete(req.params.id);
  res.json({ success:true });
});

const Navigation = require("./models/Navigation");

// ================= NAVIGATION API =================

// GET all tabs (sorted by order)
app.get("/api/navigation", async (req, res) => {
  try {
    const tabs = await Navigation.find().sort({ order: 1 });
    res.json(tabs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADD new tab
app.post("/api/navigation", async (req, res) => {
  try {
    const count = await Navigation.countDocuments();
    const newTab = await Navigation.create({
      title: req.body.title,
      link: req.body.link,
      order: count
    });
    res.json(newTab);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE tab
app.delete("/api/navigation/:id", async (req, res) => {
  try {
    await Navigation.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// REORDER tab
app.put("/api/navigation/reorder", async (req, res) => {
  try {
    const { id, direction } = req.body;
    const current = await Navigation.findById(id);
    if (!current) return res.status(404).json({ error: "Not found" });

    const swapWith = await Navigation.findOne({
      order: direction === "up" ? current.order - 1 : current.order + 1
    });

    if (!swapWith) return res.json({ success: true });

    const temp = current.order;
    current.order = swapWith.order;
    swapWith.order = temp;

    await current.save();
    await swapWith.save();

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
