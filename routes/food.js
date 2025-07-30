const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const User = require("../models/User");
const moment = require("moment");

router.post("/add", async (req, res) => {
  try {
    const { userId, foodId, miktar, selectedPorsiyon, su } = req.body;

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: "Yiyecek bulunamadı." });

    const miqdar = parseFloat(miktar);
    const qidaninqrami = selectedPorsiyon.miktar;
    const oran = (miqdar * qidaninqrami) / 100;

    // scaledEntry'yi oluştur
    const scaledEntry = {
      miktar: miqdar,
      porsiyon: selectedPorsiyon,
      yiyecekadi: food.yiyecekadi,
      kategori: food.kategori,
      glisemikIndeks: food.glisemikIndeks,
      resimUrl: food.resimUrl,
      besindegerleri: {
        kalori: {
          miktar: food.besindegerleri.kalori.miktar * oran,
          birim: food.besindegerleri.kalori.birim,
        },
        makrobesinler: {
          karbonhidrat: {
            miktar: food.besindegerleri.makrobesinler.karbohidrat.miktar * oran,
            birim: "g",
          },
          protein: {
            miktar: food.besindegerleri.makrobesinler.protein.miktar * oran,
            birim: "g",
          },
          yag: {
            miktar: food.besindegerleri.makrobesinler.yag.miktar * oran,
            birim: "g",
          },
        },
        vitaminler: food.besindegerleri.vitaminler.map((v) => ({
          ad: v.ad,
          miktar: v.miktar * oran,
          birim: v.birim,
        })),
        mineraller: food.besindegerleri.mineraller.map((m) => ({
          ad: m.ad,
          miktar: m.miktar * oran,
          birim: m.birim,
        })),
      },
    };



    const today = moment().format("YYYY-MM-DD");
    const user = await User.findById(userId);
    const existingDay = user.dailycalories.find((item) => item.tarih === today);

    if (existingDay) {
      existingDay.entries.push(scaledEntry);
    } else {
      user.dailycalories.push({
        tarih: today,
        entries: [scaledEntry],
      });
    }

    await user.save();
    res.status(200).json({ message: "Veri başarıyla eklendi." });
  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});





router.post("/addwater/:userId", async (req, res) => {
  try {
    const { su, tarih } = req.body;
    const { userId } = req.params;

    
    if (!su || typeof su.miktar !== "number" || !su.birim) {
      return res.status(400).json({ message: "Geçersiz su bilgisi." });
    }
    
    const user = await User.findById(userId);
    if (!user)
      return res.status(404).json({ message: "Kullanıcı bulunamadı." });
    
    const existingDay = user.dailywater.find((item) => item.tarih === tarih);

    if (existingDay) {
      existingDay.entries.push({ su });
    } else {
      user.dailywater.push({
        tarih,
        entries: [{ su }],
      });
    }
    if (!userId) return res.status(400).json({ message: "userId eksik." });

    await user.save();
    res.status(200).json({ message: "Su verisi başarıyla eklendi." });
  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});




module.exports = router;
