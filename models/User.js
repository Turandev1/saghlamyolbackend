const mongoose = require("mongoose");

const userschema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    yas: { type: Number, default: 0 },
    cinsiyet: { type: String, enum: ["erkek", "kadin"], required: false },
    boy: { type: Number, default: 0 },
    kilo: { type: Number, default: 0 },
    hedefkilo: { type: Number, default: 0 },
    hedefkiloTipi: {
      type: String,
      enum: ["kiloAl", "kiloVer", "koru"],
      default: "koru",
    },
    hedefkalori: { type: Number, default: 0 },

    // 🔽 Günlük alınan yiyecekleri buraya kaydedeceğiz
    dailycalories: [
      {
        tarih: { type: String }, // "2025-07-14" formatında saklanacak
        gun: { type: String }, // "Bzr", "B.e", "Ç.a", "Çər", "C.a", "Cüm", "Şnb"
        entries: [
          {
            miktar: Number,
            porsiyon: {
              ad: String,
              miktar: Number,
              birim: String,
            },
            yiyecekadi: String,
            kategori: String,
            glisemikIndeks: String,
            resimUrl: String,
            besindegerleri: {
              kalori: {
                miktar: Number,
                birim: String,
              },
              makrobesinler: {
                karbonhidrat: {
                  miktar: Number,
                  birim: String,
                },
                protein: {
                  miktar: Number,
                  birim: String,
                },
                yag: {
                  miktar: Number,
                  birim: String,
                },
              },
              vitaminler: [
                {
                  ad: String,
                  miktar: Number,
                  birim: String,
                },
              ],
              mineraller: [
                {
                  ad: String,
                  miktar: Number,
                  birim: String,
                },
              ],
            },
          },
        ],
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("User", userschema);
