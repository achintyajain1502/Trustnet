require("./db");
const express = require("express");
const path = require("path");
const cors = require("cors");
const mongoose = require("mongoose");
const multer = require("multer");

const app = express();
const PORT = 3000;

// ===================== MIDDLEWARE =====================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ===================== MULTER CONFIG =====================
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + "-" + file.originalname)
});
const upload = multer({ storage });

// ===================== SCHEMAS =====================
const dateSchema = new mongoose.Schema({
  event: String,
  date: String
});
const DateModel = mongoose.model("Date", dateSchema);

const speakerSchema = new mongoose.Schema({
  name: String,
  affiliation: String,
  image: String
});
const Speaker = mongoose.model("Speaker", speakerSchema);

const committeeSchema = new mongoose.Schema({
  name: String,
  designation: String,
  image: String
});
const Committee = mongoose.model("Committee", committeeSchema);

const publisherSchema = new mongoose.Schema({
  name: String,
  logo: String
});
const Publisher = mongoose.model("Publisher", publisherSchema);

const partnerSchema = new mongoose.Schema({
  name: String,
  logo: String
});
const Partner = mongoose.model("Partner", partnerSchema);

const navigationSchema = new mongoose.Schema({
  title: String,
  link: String,
  order: Number
});
const Navigation = mongoose.model("Navigation", navigationSchema);

const tabSchema = new mongoose.Schema({
  tabName: String,
  headline: String,
  content: String,
  image: String,
  slug: String
});
const Tab = mongoose.model("Tab", tabSchema);



// ===================== GET ROUTES =====================
app.get("/api/dates", async (req, res) => {
  res.json(await DateModel.find());
});

app.get("/api/speakers", async (req, res) => {
  res.json(await Speaker.find());
});

app.get("/api/committee", async (req, res) => {
  res.json(await Committee.find());
});

app.get("/api/publishers", async (req, res) => {
  res.json(await Publisher.find());
});

app.get("/api/partners", async (req, res) => {
  res.json(await Partner.find());
});

app.get("/api/navigation", async (req, res) => {
  res.json(await Navigation.find().sort({ order: 1 }));
});

app.get("/api/tabs", async (req, res) => {
  res.json(await Tab.find());
});

app.get("/api/tabs/slug/:slug", async (req, res) => {
  const page = await Tab.findOne({ slug: req.params.slug });
  res.json(page);
});

// ===================== POST ROUTES =====================
app.post("/api/dates", async (req, res) => {
  res.json(await DateModel.create(req.body));
});

app.post("/api/speakers", upload.single("image"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  res.json(await Speaker.create({
    name: req.body.name,
    affiliation: req.body.affiliation,
    image: host + "/uploads/" + req.file.filename
  }));
});

app.post("/api/committee", upload.single("image"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  res.json(await Committee.create({
    name: req.body.name,
    designation: req.body.designation,
    image: host + "/uploads/" + req.file.filename
  }));
});

app.post("/api/publishers", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  res.json(await Publisher.create({
    name: req.body.name,
    logo: host + "/uploads/" + req.file.filename
  }));
});

app.post("/api/partners", upload.single("logo"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");
  res.json(await Partner.create({
    name: req.body.name,
    logo: host + "/uploads/" + req.file.filename
  }));
});

app.post("/api/navigation", async (req, res) => {
  const count = await Navigation.countDocuments();
  res.json(await Navigation.create({
    title: req.body.title,
    link: req.body.link,
    order: count
  }));
});

app.post("/api/tabs", upload.single("image"), async (req, res) => {
  const host = req.protocol + "://" + req.get("host");

  const slug = req.body.tabName
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^\w-]+/g, "");

  res.json(await Tab.create({
    tabName: req.body.tabName,
    headline: req.body.headline,
    content: req.body.content,
    slug: slug,
    image: req.file ? host + "/uploads/" + req.file.filename : ""
  }));
});

// ===================== UPDATE ROUTES =====================
app.put("/api/dates/:id", async (req, res) => {
  const updated = await DateModel.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true }
  );
  res.json(updated);
});

app.put("/api/speakers/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    affiliation: req.body.affiliation
  };

  if (req.file) {
    const host = req.protocol + "://" + req.get("host");
    updateData.image = host + "/uploads/" + req.file.filename;
  }

  const updated = await Speaker.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(updated);
});

app.put("/api/committee/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    name: req.body.name,
    designation: req.body.designation
  };

  if (req.file) {
    const host = req.protocol + "://" + req.get("host");
    updateData.image = host + "/uploads/" + req.file.filename;
  }

  const updated = await Committee.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(updated);
});


app.put("/api/publishers/:id", upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    const host = req.protocol + "://" + req.get("host");
    updateData.logo = host + "/uploads/" + req.file.filename;
  }

  const updated = await Publisher.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(updated);
});

app.put("/api/partners/:id", upload.single("logo"), async (req, res) => {
  const updateData = { name: req.body.name };

  if (req.file) {
    const host = req.protocol + "://" + req.get("host");
    updateData.logo = host + "/uploads/" + req.file.filename;
  }

  const updated = await Partner.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(updated);
});

app.put("/api/tabs/:id", upload.single("image"), async (req, res) => {
  const updateData = {
    tabName: req.body.tabName,
    headline: req.body.headline,
    content: req.body.content
  };

  if (req.file) {
    const host = req.protocol + "://" + req.get("host");
    updateData.image = host + "/uploads/" + req.file.filename;
  }

  const updated = await Tab.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true }
  );

  res.json(updated);
});

app.put("/api/navigation/:id", async (req,res)=>{
  const { title, link } = req.body;
  await Navigation.findByIdAndUpdate(req.params.id, { title, link });
  res.json({ success:true });
});

// ===================== DELETE ROUTES =====================
app.delete("/api/dates/:id", async (req, res) => {
  await DateModel.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/speakers/:id", async (req, res) => {
  await Speaker.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/committee/:id", async (req, res) => {
  await Committee.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/publishers/:id", async (req, res) => {
  await Publisher.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/partners/:id", async (req, res) => {
  await Partner.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/navigation/:id", async (req, res) => {
  await Navigation.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});

app.delete("/api/tabs/:id", async (req, res) => {
  await Tab.findByIdAndDelete(req.params.id);
  res.json({ success: true });
});


// ===================== START SERVER =====================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

// ===================== SEPARATE DYNAMIC PAGE =====================
app.get("/page/:slug", async (req, res) => {
  try {
    const tab = await Tab.findOne({ slug: req.params.slug });

    if (!tab) return res.send("Page not found");

    res.send(`
      <html>
      <head>
        <title>${tab.tabName}</title>
        <style>
          body{font-family:sans-serif;padding:40px;background:#eef1f6}
          .box{background:#fff;padding:40px;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,0.1)}
          img{max-width:100%;margin-top:20px;border-radius:10px}
          a{display:inline-block;margin-top:30px;color:#2563EB;text-decoration:none}
        </style>
      </head>
      <body>
        <div class="box">
          <h1>${tab.headline}</h1>
          <p>${tab.content}</p>
          ${tab.image ? `<img src="${tab.image}">` : ""}
          <br>
          <a href="/">← Back to Home</a>
        </div>
      </body>
      </html>
    `);

  } catch (err) {
    res.send("Error loading page");
  }
});

// ===================== CATCH ALL =====================
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});
