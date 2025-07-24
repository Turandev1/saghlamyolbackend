const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const User = require("../models/User");
const moment = require("moment"); // tarihi düzgün almak için

router.post("/add", async (req, res) => {
  try {
    const { userId, foodId, miktar, selectedPorsiyon,nasa } = req.body;

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: "Yiyecek bulunamadı." });

    const oran = parseFloat(miktar);

    const scaledEntry = {
      miktar: oran,
      porsiyon: selectedPorsiyon,
      yiyecekadi: food.yiyecekadi,
      kategori: food.kategori,
      glisemikIndeks: food.glisemikIndeks,
      resimUrl: food.resimUrl,
      besindegerleri: {
        nasa:nasa,
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

    res.status(200).json({ message: "Yiyecek başarıyla eklendi." });
  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});

module.exports = router;
