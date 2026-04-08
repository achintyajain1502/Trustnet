require("dotenv").config(); // Add this if not present, to load .env
const express = require("express");
const path = require("path");
const cors = require("cors");
const multer = require("multer");
const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();
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

// ===================== GET ROUTES =====================
app.get("/api/dates", async (req, res) => {
  try {
    const dates = await prisma.date.findMany();
    res.json(dates);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/speakers", async (req, res) => {
  try {
    const speakers = await prisma.speaker.findMany();
    res.json(speakers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/committee", async (req, res) => {
  try {
    const committee = await prisma.committee.findMany();
    res.json(committee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/publishers", async (req, res) => {
  try {
    const publishers = await prisma.publisher.findMany();
    res.json(publishers);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/partners", async (req, res) => {
  try {
    const partners = await prisma.partner.findMany();
    res.json(partners);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/navigation", async (req, res) => {
  try {
    const navigation = await prisma.navigation.findMany();
    res.json(navigation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/tabs", async (req, res) => {
  try {
    const tabs = await prisma.tab.findMany();
    res.json(tabs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== POST ROUTES =====================
app.post("/api/dates", async (req, res) => {
  try {
    const date = await prisma.date.create({
      data: { event: req.body.event, date: req.body.date }
    });
    res.json(date);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/speakers", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const speaker = await prisma.speaker.create({
      data: {
        name: req.body.name,
        affiliation: req.body.affiliation,
        image: req.file ? `${host}/uploads/${req.file.filename}` : ""
      }
    });
    res.json(speaker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/committee", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const committee = await prisma.committee.create({
      data: {
        name: req.body.name,
        designation: req.body.designation,
        image: req.file ? `${host}/uploads/${req.file.filename}` : ""
      }
    });
    res.json(committee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/publishers", upload.single("logo"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const publisher = await prisma.publisher.create({
      data: {
        name: req.body.name,
        logo: req.file ? `${host}/uploads/${req.file.filename}` : ""
      }
    });
    res.json(publisher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/partners", upload.single("logo"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const partner = await prisma.partner.create({
      data: {
        name: req.body.name,
        logo: req.file ? `${host}/uploads/${req.file.filename}` : ""
      }
    });
    res.json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/navigation", async (req, res) => {
  try {
    const navigation = await prisma.navigation.create({
      data: {
        title: req.body.title,
        link: req.body.link,
        order: parseInt(req.body.order)
      }
    });
    res.json(navigation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/tabs", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const tab = await prisma.tab.create({
      data: {
        tabName: req.body.tabName,
        headline: req.body.headline,
        content: req.body.content,
        image: req.file ? `${host}/uploads/${req.file.filename}` : "",
        slug: req.body.slug
      }
    });
    res.json(tab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== UPDATE ROUTES =====================
app.put("/api/dates/:id", async (req, res) => {
  try {
    const date = await prisma.date.update({
      where: { id: req.params.id },
      data: { event: req.body.event, date: req.body.date }
    });
    res.json(date);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/speakers/:id", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const data = {
      name: req.body.name,
      affiliation: req.body.affiliation
    };
    if (req.file) data.image = `${host}/uploads/${req.file.filename}`;
    const speaker = await prisma.speaker.update({
      where: { id: req.params.id },
      data
    });
    res.json(speaker);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/committee/:id", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const data = {
      name: req.body.name,
      designation: req.body.designation
    };
    if (req.file) data.image = `${host}/uploads/${req.file.filename}`;
    const committee = await prisma.committee.update({
      where: { id: req.params.id },
      data
    });
    res.json(committee);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/publishers/:id", upload.single("logo"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const data = { name: req.body.name };
    if (req.file) data.logo = `${host}/uploads/${req.file.filename}`;
    const publisher = await prisma.publisher.update({
      where: { id: req.params.id },
      data
    });
    res.json(publisher);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/partners/:id", upload.single("logo"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const data = { name: req.body.name };
    if (req.file) data.logo = `${host}/uploads/${req.file.filename}`;
    const partner = await prisma.partner.update({
      where: { id: req.params.id },
      data
    });
    res.json(partner);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/navigation/:id", async (req, res) => {
  try {
    const navigation = await prisma.navigation.update({
      where: { id: req.params.id },
      data: {
        title: req.body.title,
        link: req.body.link,
        order: parseInt(req.body.order)
      }
    });
    res.json(navigation);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/tabs/:id", upload.single("image"), async (req, res) => {
  try {
    const host = req.protocol + "://" + req.get("host");
    const data = {
      tabName: req.body.tabName,
      headline: req.body.headline,
      content: req.body.content,
      slug: req.body.slug
    };
    if (req.file) data.image = `${host}/uploads/${req.file.filename}`;
    const tab = await prisma.tab.update({
      where: { id: req.params.id },
      data
    });
    res.json(tab);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== DELETE ROUTES =====================
app.delete("/api/dates/:id", async (req, res) => {
  try {
    await prisma.date.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/speakers/:id", async (req, res) => {
  try {
    await prisma.speaker.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/committee/:id", async (req, res) => {
  try {
    await prisma.committee.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/publishers/:id", async (req, res) => {
  try {
    await prisma.publisher.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/partners/:id", async (req, res) => {
  try {
    await prisma.partner.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/navigation/:id", async (req, res) => {
  try {
    await prisma.navigation.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/tabs/:id", async (req, res) => {
  try {
    await prisma.tab.delete({ where: { id: req.params.id } });
    res.json({ message: "Deleted" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// ===================== START SERVER =====================
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));