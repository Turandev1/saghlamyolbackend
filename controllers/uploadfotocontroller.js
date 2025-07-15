// file: controllers/uploadController.js

const multer = require("multer");
const path = require("path");
const fs = require("fs");
const mongoose = require("mongoose");

// Upload klasörü yoksa oluştur
const uploadDir = path.join(__dirname, "../uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Multer disk storage ayarı
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(
      Math.random() * 1e9
    )}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});

// Multer middleware
const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowed = ["image/jpeg", "image/png", "image/jpg"];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error("Yalnızca resim dosyaları yüklenebilir."));
    }
    cb(null, true);
  },
});

// MongoDB modeli
const ImageSchema = new mongoose.Schema({
  filename: String,
  filepath: String, // Artık burada tam URL olacak
  uploadedAt: { type: Date, default: Date.now },
});

const Image = mongoose.model("Image", ImageSchema);

// Controller: Yükleme işlemi
const uploadSingleFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Dosya bulunamadı" });
    }

    const customFilename = req.body.customFilename;

    // Dosya adını değiştirme (opsiyonel)
    if (customFilename && customFilename !== req.file.filename) {
      const oldPath = req.file.path;
      const newPath = path.join(uploadDir, customFilename);
      fs.renameSync(oldPath, newPath);
      req.file.filename = customFilename;
      req.file.path = newPath;
    }

    // 🔗 Dosya URL’sini oluştur
    const protocol = req.protocol;              // http veya https
    const host = req.get("host");               // localhost:5000 veya domain
    const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

    // MongoDB'ye kayıt
    const newImage = new Image({
      filename: req.file.filename,
      filepath: fileUrl, // ← artık tam URL
    });

    await newImage.save();

    res.status(201).json({
      message: "Dosya yüklendi ve DB'ye kaydedildi",
      filename: newImage.filename,
      filepath: newImage.filepath,
      uploadedAt: newImage.uploadedAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Yükleme hatası" });
  }
};

// Controller: Yüklenen tüm resimleri listele
const listImages = async (req, res) => {
  try {
    const images = await Image.find().sort({ uploadedAt: -1 });
    res.json(images);
  } catch (err) {
    res.status(500).json({ message: "Veri alınamadı" });
  }
};

module.exports = {
  upload,
  uploadSingleFile,
  listImages,
};
