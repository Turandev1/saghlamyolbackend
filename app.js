const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config(); // Load environment variables first
require("./ping");
const path = require("path");

// --- Rotaları içeri aktarma ---
const yiyecekRoutes = require("./controllers/foods");
const authRoutes = require("./routes/authroute");
const trackfoods = require("./routes/food");
const approutes = require("./routes/approute");

const app = express();

// --- Middleware'ler ---
// CORS ayarları
app.use(
  cors({
    origin: "*", // Her yerden isteklere izin ver
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE"], // İzin verilen HTTP metotları
  })
);

// Gelen JSON isteklerini ayrıştırma
app.use(express.json());

// --- MongoDB Bağlantısı ---
if (!process.env.MONGO_URI) {
  console.error("Hata: MONGO_URI ortam değişkeni tanımlı değil.");
  process.exit(1); // Uygulamadan çık
}

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB bağlantısı başarılı."))
  .catch((err) => {
    console.error("Veritabanı bağlantı hatası:", err);
    process.exit(1); // Bağlantı hatasında uygulamadan çık
  });

// --- Rotaları Kullanma ---
// Yiyecekler için API rotaları
app.use("/api/yiyecekler", yiyecekRoutes);

// Kimlik doğrulama için API rotaları
app.use("/api/auth", authRoutes);
app.use("/api/app", approutes);
// ----- DÜZELTİLMİŞ FOTOĞRAF YÜKLEME ROTALARI -----
// Artık 'upload', 'uploadFile', 'getFiles' ve 'getImageByName'
// doğrudan tanındığı için yalın halde kullanılabilir.

// @route POST /upload
// @desc Tek bir dosya yükler
app.use("/uploads", express.static("uploads"));

// Yükleme endpointleri
app.post("/upload", upload.single("file"), uploadSingleFile);
app.get("/images", listImages);
// Sunucu portunu tanımla

//kullanici gida ekleme
app.use("/api/food", trackfoods);
const PORT = process.env.PORT || 8080;

// Server başlat
app.listen(PORT);
