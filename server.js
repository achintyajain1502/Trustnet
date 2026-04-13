const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const multer = require("multer");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { put } = require("@vercel/blob");

const app = express();
const publicDir = path.join(__dirname, "public");
const mongoUri =
  process.env.MONGODB_URI ||
  process.env.MONGO_URI ||
  "mongodb://127.0.0.1:27017/trustnet";
let mongoConnectionPromise;
const bundledUploadsDir = path.join(__dirname, "uploads");
const uploadDir = process.env.VERCEL
  ? path.join(os.tmpdir(), "trustnet-uploads")
  : bundledUploadsDir;
const useBlobStorage = Boolean(process.env.BLOB_READ_WRITE_TOKEN);
const isVercel = Boolean(process.env.VERCEL);

if (!isVercel) {
  fs.mkdirSync(uploadDir, { recursive: true });
  fs.mkdirSync(bundledUploadsDir, { recursive: true });
} else {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// ===== MIDDLEWARE =====
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
if (!isVercel) {
  app.use("/uploads", express.static(bundledUploadsDir));
}
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

async function requireMongo(req, res, next) {
  try {
    await connectToMongo();
    next();
  } catch (err) {
    res.status(500).json({ error: "Database connection failed" });
  }
}

// ===== MULTER =====
const storage = useBlobStorage
  ? multer.memoryStorage()
  : multer.diskStorage({
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

async function resolveUploadedFile(file) {
  if (!file) {
    return "";
  }

  if (process.env.VERCEL && !useBlobStorage) {
    throw new Error("File uploads require BLOB_READ_WRITE_TOKEN on Vercel");
  }

  if (useBlobStorage) {
    const blob = await put(
      `trustnet/${Date.now()}-${file.originalname}`,
      file.buffer,
      {
        access: "public",
        token: process.env.BLOB_READ_WRITE_TOKEN,
        addRandomSuffix: true,
      }
    );

    return blob.url;
  }

  return `/uploads/${file.filename}`;
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
const TopRightLogo = mongoose.model("TopRightLogo", new mongoose.Schema({
  image: String,
  position: Number,
}));

// ===== ROUTES =====

// ✅ VERY IMPORTANT: PAGE ROUTE FIRST
app.get("/page/:slug", requireMongo, async (req, res) => {
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
app.get("/api/page/:slug", requireMongo, async (req, res) => {
  const page = await Tab.findOne({ slug: req.params.slug });
  if (!page) return res.status(404).json({ error: "Not found" });
  res.json(page);
});

app.get("/api/top-right-logos", requireMongo, async (req, res) => {
  res.json(await TopRightLogo.find().sort({ position: 1, _id: 1 }));
});

app.get("/api/health", requireMongo, async (req, res) => {
  res.json({
    ok: true,
    mongoReadyState: mongoose.connection.readyState,
    storage: useBlobStorage ? "vercel-blob" : "local-disk",
  });
});

app.get("/api/tabs", requireMongo, async (req, res) => res.json(await Tab.find()));

app.post("/api/tabs", requireMongo, upload.single("image"), async (req, res) => {
  const slug = generateSlug(req.body.tabName || "page");
  const image = await resolveUploadedFile(req.file);

  const newTab = await Tab.create({
    tabName: req.body.tabName,
    headline: req.body.headline,
    content: req.body.content,
    slug: slug,
    image,
  });

  res.json(newTab);
});

app.put("/api/tabs/:id", requireMongo, upload.single("image"), async (req, res) => {
  const existingTab = await Tab.findById(req.params.id);
  if (!existingTab) {
    return res.status(404).json({ error: "Not found" });
  }

  const updatedTab = await Tab.findByIdAndUpdate(
    req.params.id,
    {
      tabName: req.body.tabName,
      headline: req.body.headline,
      content: req.body.content,
      slug: generateSlug(req.body.tabName || existingTab.tabName || "page"),
      image: req.file ? await resolveUploadedFile(req.file) : existingTab.image,
    },
    { new: true }
  );

  res.json(updatedTab);
});

app.delete("/api/tabs/:id", requireMongo, async (req, res) => {
  await Tab.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

// ===== OTHER APIs =====
app.get("/api/dates", requireMongo, async (req, res) => res.json(await DateModel.find()));
app.post("/api/dates", requireMongo, async (req, res) => res.json(await DateModel.create(req.body)));
app.delete("/api/dates/:id", requireMongo, async (req, res) => {
  await DateModel.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.get("/api/speakers", requireMongo, async (req, res) => res.json(await Speaker.find()));
app.post("/api/speakers", requireMongo, upload.single("image"), async (req, res) => {
  const image = await resolveUploadedFile(req.file);
  res.json(await Speaker.create({
    name: req.body.name,
    affiliation: req.body.affiliation,
    image,
  }));
});

app.get("/api/committee", requireMongo, async (req, res) => res.json(await Committee.find()));
app.post("/api/committee", requireMongo, upload.single("image"), async (req, res) => {
  const image = await resolveUploadedFile(req.file);
  res.json(await Committee.create({
    name: req.body.name,
    designation: req.body.designation,
    image,
  }));
});

app.get("/api/publishers", requireMongo, async (req, res) => res.json(await Publisher.find()));
app.post("/api/publishers", requireMongo, upload.single("logo"), async (req, res) => {
  const logo = await resolveUploadedFile(req.file);
  res.json(await Publisher.create({
    name: req.body.name,
    logo,
  }));
});

app.get("/api/partners", requireMongo, async (req, res) => res.json(await Partner.find()));
app.post("/api/partners", requireMongo, upload.single("logo"), async (req, res) => {
  const logo = await resolveUploadedFile(req.file);
  res.json(await Partner.create({
    name: req.body.name,
    logo,
  }));
});

app.post("/api/top-right-logos", requireMongo, upload.single("image"), async (req, res) => {
  const image = await resolveUploadedFile(req.file);
  const requestedPosition = Number(req.body.position);
  const lastLogo = await TopRightLogo.findOne().sort({ position: -1, _id: -1 });
  const position = Number.isFinite(requestedPosition) && requestedPosition > 0
    ? requestedPosition
    : (lastLogo?.position || 0) + 1;

  res.json(await TopRightLogo.create({ image, position }));
});

app.put("/api/top-right-logos/:id", requireMongo, upload.single("image"), async (req, res) => {
  const updateData = {};
  const requestedPosition = Number(req.body.position);

  if (Number.isFinite(requestedPosition) && requestedPosition > 0) {
    updateData.position = requestedPosition;
  }

  if (req.file) {
    updateData.image = await resolveUploadedFile(req.file);
  }

  const updated = await TopRightLogo.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// ===== UPDATE APIs =====

// DATES
app.put("/api/dates/:id", requireMongo, async (req, res) => {
  const updated = await DateModel.findByIdAndUpdate(req.params.id, req.body, { new: true });
  res.json(updated);
});

// SPEAKERS
app.put("/api/speakers/:id", requireMongo, upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    affiliation: req.body.affiliation
  };

  if (req.file) {
    updateData.image = await resolveUploadedFile(req.file);
  }

  const updated = await Speaker.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// COMMITTEE
app.put("/api/committee/:id", requireMongo, upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    designation: req.body.designation
  };

  if (req.file) {
    updateData.image = await resolveUploadedFile(req.file);
  }

  const updated = await Committee.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// PUBLISHERS
app.put("/api/publishers/:id", requireMongo, upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    updateData.logo = await resolveUploadedFile(req.file);
  }

  const updated = await Publisher.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

// PARTNERS
app.put("/api/partners/:id", requireMongo, upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    updateData.logo = await resolveUploadedFile(req.file);
  }

  const updated = await Partner.findByIdAndUpdate(req.params.id, updateData, { new: true });
  res.json(updated);
});

//=======DELETE APIS=========
app.delete("/api/speakers/:id", requireMongo, async (req,res)=>{
  await Speaker.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/committee/:id", requireMongo, async (req,res)=>{
  await Committee.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/publishers/:id", requireMongo, async (req,res)=>{
  await Publisher.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/partners/:id", requireMongo, async (req,res)=>{
  await Partner.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

app.delete("/api/top-right-logos/:id", requireMongo, async (req,res)=>{
  await TopRightLogo.findByIdAndDelete(req.params.id);
  res.json({success:true});
});

// ✅ STATIC AFTER ROUTES
app.use(express.static(publicDir));

// ===== DEFAULT =====
app.get("/", (req, res) => {
  res.sendFile(path.join(publicDir, "index.html"));
});

// ===== SERVER =====
if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`🚀 Server running on http://localhost:${port}`));
}

app.use((err, req, res, next) => {
  console.error(err);

  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: err.message || "Internal server error" });
});

module.exports = app;
