const express = require("express");
const router = express.Router();
const Food = require("../models/Food");
const User = require("../models/User");
const moment = require("moment"); // tarihi düzgün almak için

router.post("/add", async (req, res) => {
  try {
    const { userId, foodId, miktar, selectedPorsiyon } = req.body;

    const food = await Food.findById(foodId);
    if (!food) return res.status(404).json({ message: "Yiyecek bulunamadı." });

    const miqdar = parseFloat(miktar);
    const qidaninqrami = selectedPorsiyon.miktar
    const oran=(miqdar* qidaninqrami)/100

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
    res.status(200).json({ message: "Yiyecek başarıyla eklendi." });
  } catch (error) {
    console.error("Sunucu hatası:", error);
    res.status(500).json({ message: "Sunucu hatası." });
  }
});



router.put("/updatefood/:entryId/:date", async (req, res) => {
  try {
    const { userId, miktar, selectedPorsiyon } = req.body;
    const { entryId, date } = req.params;

    console.log("📥 PUT /updatefood request alındı");
    console.log("➡️ Params:", { entryId, date });
    console.log("➡️ Body:", { userId, miktar, selectedPorsiyon });

    const user = await User.findById(userId);
    if (!user) {
      console.warn("⚠️ İstifadəçi tapılmadı:", userId);
      return res.status(404).json({ message: "İstifadəçi tapılmadı." });
    }

    const formattedDate = moment(date, "YYYY-MM-DD", true);
    if (!formattedDate.isValid()) {
      console.warn("⚠️ Daxil edilən tarix düzgün formatda deyil:", date);
      return res.status(400).json({
        message: "Tarix düzgün formatda deyil (YYYY-MM-DD olmalıdır).",
      });
    }

    const dateStr = formattedDate.format("YYYY-MM-DD");

    const dayEntry = user.dailycalories.find((d) => d.tarih === dateStr);
    if (!dayEntry) {
      console.warn("⚠️ Göstərilən tarixə aid məlumat tapılmadı:", dateStr);
      return res
        .status(404)
        .json({ message: "Bu tarixə aid məlumat tapılmadı." });
    }

    const entryIndex = dayEntry.entries.findIndex(
      (e) => String(e._id) === entryId
    );
    if (entryIndex === -1) {
      console.warn("⚠️ Qida qeydi tapılmadı:", entryId);
      return res.status(404).json({ message: "Qida qeydi tapılmadı." });
    }

    const existingEntry = dayEntry.entries[entryIndex];

    const food = await Food.findOne({ yiyecekadi: existingEntry.yiyecekadi });
    if (!food) {
      console.warn(
        "⚠️ Əsas qida məlumatı tapılmadı:",
        existingEntry.yiyecekadi
      );
      return res.status(404).json({ message: "Əsas qida məlumatı tapılmadı." });
    }

    const miqdar = parseFloat(miktar);
    const qidaninqrami = selectedPorsiyon.miktar;
    const oran = (miqdar * qidaninqrami) / 100;

    console.log("🔢 Hesablama oranı:", oran);

    const updatedEntry = {
      ...existingEntry,
      miktar: miqdar,
      porsiyon: selectedPorsiyon,
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

    // Güncelleme
    dayEntry.entries[entryIndex] = updatedEntry;

    await user.save();
    console.log("✅ Qida uğurla yeniləndi:", entryId);

    res.status(200).json({ message: "Qida uğurla yeniləndi." });
  } catch (error) {
    console.error("❌ Qida yenilənərkən xəta baş verdi:", error);
    res.status(500).json({ message: "Server xətası." });
  }
});

module.exports = router;


module.exports = router;