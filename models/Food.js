const mongoose = require("mongoose");
const mongoosepaginate = require("mongoose-paginate-v2");
const altbilesenschema = new mongoose.Schema({
  miktar: Number,
  birim: String,
});

const makrobesinschema = new mongoose.Schema({
  karbohidrat: {
    miktar: Number,
    birim: String,
    altbilesenler: {
      seker: altbilesenschema,
      lif: altbilesenschema,
    },
  },
  protein: altbilesenschema,
  yag: altbilesenschema,
});

const besindegerlerischema = new mongoose.Schema({
  basemiqdar:{type:Number,required:true, default:100},
  kalori: altbilesenschema,
  makrobesinler: makrobesinschema,
  vitaminler: [{ ad: String, miktar: Number, birim: String }],
  mineraller: [{ ad: String, miktar: Number, birim: String }],
});

const porsiyonschema = new mongoose.Schema({
  ad: String,
  miktar: Number,
  birim: String,
  aciklama: String,
});



const yiyecekschema = new mongoose.Schema({
  yiyecekadi: { type: String, unique: true },
  kategori: String,
  porsiyonlar: [porsiyonschema],
  besindegerleri: besindegerlerischema,
  resimUrl: String,
  // Yeni eklenen glisemik indeks alanı
  glisemikIndeks: {
    type: String,
    enum: ["Aağı", "Orta", "Yüksək", null], // Allow these values or null if not applicable
    default: null,
  },
  olusturulmatarihi: Date,
  songuncellenmetarihi: Date,
});



yiyecekschema.plugin(mongoosepaginate);
module.exports = mongoose.model("Yiyecek", yiyecekschema);
