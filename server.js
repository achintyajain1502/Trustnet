const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");

const app = express();
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/trustnet";
let mongoConnectionPromise;
const bundledUploadsDir = path.join(__dirname, "uploads");
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "trustnet-uploads")
  : bundledUploadsDir;

fs.mkdirSync(uploadDir, { recursive: true });
fs.mkdirSync(bundledUploadsDir, { recursive: true });

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static(bundledUploadsDir));
app.use("/uploads", express.static(uploadDir));

// ❗ IMPORTANT: DO NOT put static first
// app.use(express.static("public")); ❌ (moved below)

// ===== MONGODB =====
function connectToMongo() {
  if (!mongoConnectionPromise) {
    mongoConnectionPromise = mongoose.connect(mongoUri)
      .then(() => console.log("MongoDB Connected ✅"))
      .catch(err => {
        console.log("Mongo Error ❌", err);
        mongoConnectionPromise = null;
        throw err;
      });
  }

  return mongoConnectionPromise;
}

connectToMongo().catch(() => {});

// ===== MULTER =====
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// ===== HELPER =====
function generateSlug(text) {
  return text.toLowerCase().replace(/\s+/g, "-");
}

// ===== SCHEMAS =====
const TabSchema = new mongoose.Schema({
  tabName: String,
  headline: String,
  content: String,
  image: String,
  slug: String,
});
const Tab = mongoose.model("Tab", TabSchema);

const DateModel = mongoose.model("Date", new mongoose.Schema({ event: String, date: String }));
const Speaker = mongoose.model("Speaker", new mongoose.Schema({ name: String, affiliation: String, image: String }));
const Committee = mongoose.model("Committee", new mongoose.Schema({ name: String, designation: String, image: String }));
const Publisher = mongoose.model("Publisher", new mongoose.Schema({ name: String, logo: String }));
const Partner = mongoose.model("Partner", new mongoose.Schema({ name: String, logo: String }));

// ===== ROUTES =====

// ✅ VERY IMPORTANT: PAGE ROUTE FIRST
app.get("/page/:slug", async (req, res) => {
  try {
    const page = await Tab.findOne({ slug: req.params.slug });

    if (!page) {
      return res.send("❌ Page not found");
    }

    res.send(`
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>${page.tabName}</title>

<link href="https://fonts.googleapis.com/css2?family=Roboto:wght@400;700&display=swap" rel="stylesheet">

<style>
*{
  margin:0;
  padding:0;
  box-sizing:border-box;
  font-family:'Segoe UI',sans-serif;
}

body{
  background:#eef1f6;
  padding:40px;
}

/* ===== BACK BUTTON ===== */
.back-btn{
  display:inline-block;
  margin-bottom:30px;
  background:#2f6ec2;
  color:#fff;
  padding:10px 20px;
  border-radius:8px;
  font-weight:600;
  text-decoration:none;
  transition:0.2s;
}
.back-btn:hover{
  opacity:0.85;
}

/* ===== CARD ===== */
.card{
  max-width:800px;
  margin:auto;
  background:#fff;
  padding:30px;
  border-radius:16px;
  box-shadow:0 15px 40px rgba(0,0,0,0.1);
  text-align:center;
}

/* ===== HEADLINE ===== */
.card h1{
  color:#2563EB;
  margin-bottom:20px;
  text-align:center;
}

/* ===== IMAGE ===== */
.card img{
  width:100%;
  max-width:500px;
  border-radius:12px;
  margin:20px 0;
  
}

/* ===== CONTENT ===== */
.card p{
  font-size:15px;
  line-height:1.6;
  color:#333;
  text-align:justify;
}
</style>
</head>

<body>

<a href="/" class="back-btn">⬅ Back to Home</a>

<div class="card">
  <h1>${page.headline}</h1>

  ${page.image ? `<img src="${page.image}">` : ""}

  <p>${page.content}</p>
</div>

</body>
</html>
`);

  } catch (err) {
    res.send("Server Error ❌");
  }
});

// ===== API =====
app.get("/api/page/:slug", async (req, res) => {
  const page = await Tab.findOne({ slug: req.params.slug });
  if (!page) return res.status(404).json({ error: "Not found" });
  res.json(page);
});

app.get("/api/tabs", async (req, res) => res.json(await Tab.find()));

app.post("/api/tabs", upload.single("image"), async (req, res) => {
  const slug = generateSlug(req.body.tabName || "page");

  const newTab = await Tab.create({
    tabName: req.body.tabName,
    headline: req.body.headline,
    content: req.body.content,
    slug: slug,
    image: req.file ? `/uploads/${req.file.filename}` : "",
  });

  res.json(newTab);
});

app.delete("/api/tabs/:id", async (req, res) => {
  await Tab.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== OTHER APIs =====
app.get("/api/dates", async (req, res) => res.json(await DateModel.find()));
app.post("/api/dates", async (req, res) => res.json(await DateModel.create(req.body)));
app.delete("/api/dates/:id", async (req, res) => {
  await DateModel.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get("/api/speakers", async (req, res) => res.json(await Speaker.find()));
app.post("/api/speakers", upload.single("image"), async (req, res) => {
  res.json(await Speaker.create({
    name: req.body.name,
    affiliation: req.body.affiliation,
    image: req.file ? `/uploads/${req.file.filename}` : "",
  }));
});

app.get("/api/committee", async (req, res) => res.json(await Committee.find()));
app.post("/api/committee", upload.single("image"), async (req, res) => {
  res.json(await Committee.create({
    name: req.body.name,
    designation: req.body.designation,
    image: req.file ? `/uploads/${req.file.filename}` : "",
  }));
});

app.get("/api/publishers", async (req, res) => res.json(await Publisher.find()));
app.post("/api/publishers", upload.single("logo"), async (req, res) => {
  res.json(await Publisher.create({
    name: req.body.name,
    logo: req.file ? `/uploads/${req.file.filename}` : "",
  }));
});

app.get("/api/partners", async (req, res) => res.json(await Partner.find()));
app.post("/api/partners", upload.single("logo"), async (req, res) => {
  res.json(await Partner.create({
    name: req.body.name,
    logo: req.file ? `/uploads/${req.file.filename}` : "",
  }));
});

// ===== UPDATE APIs =====

// DATES
app.put("/api/dates/:id", async (req, res) => {
  const updated = await DateModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// SPEAKERS
app.put("/api/speakers/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    affiliation: req.body.affiliation
  };

  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  const updated = await Speaker.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// COMMITTEE
app.put("/api/committee/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    designation: req.body.designation
  };

  if (req.file) {
    updateData.image = `/uploads/${req.file.filename}`;
  }

  const updated = await Committee.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// PUBLISHERS
app.put("/api/publishers/:id", upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    updateData.logo = `/uploads/${req.file.filename}`;
  }

  const updated = await Publisher.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// PARTNERS
app.put("/api/partners/:id", upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    updateData.logo = `/uploads/${req.file.filename}`;
  }

  const updated = await Partner.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

//=======DELETE APIS=========
app.delete("/api/speakers/:id", async (req,res)=>{
  await Speaker.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/committee/:id", async (req,res)=>{
  await Committee.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/publishers/:id", async (req,res)=>{
  await Publisher.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/partners/:id", async (req,res)=>{
  await Partner.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

// ✅ STATIC AFTER ROUTES
app.use(express.static("public"));

// ===== DEFAULT =====
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ===== SERVER =====
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
}

module.exports = app;