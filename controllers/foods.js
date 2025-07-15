const express = require('express');
const router = express.Router()
const Yiyecek = require('../models/Food')
const mongoose = require('mongoose');

router.get("/filters", async (req, res) => {
  try {
    const search = req.query.search?.trim() || "";
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;

    const query = search
      ? { yiyecekadi: { $regex: search, $options: "i" } }
      : {};

    const options = {
      page,
      limit,
      sort: { olusturulmatarihi: -1 },
      lean: true,
    };

    const result = await Yiyecek.paginate(query, options);

    res.status(200).json({
      docs: result.docs,
      totalDocs: result.totalDocs,
      totalPages: result.totalPages,
      page: result.page,
      hasNextPage: result.hasNextPage,
      hasPrevPage: result.hasPrevPage,
    });
  } catch (error) {
    console.error("❌ GET /api/yiyecekler filtreleme hatası:", error);
    res.status(500).json({
      hata: "Sunucu hatası oluştu.",
      detay: error.message,
    });
  }
});


router.get('/', async (req, res) => {
    try {
        //tum verileri cek
        const yiyecekler = await Yiyecek.find();
        
        return res.status(200).json(yiyecekler);

    } catch (e) {
        console.error("❌ GET /api/yiyecekler hatası:", e);
        return res.status(500).json({ hata: "Sunucu hatası oluştu." });
    }
})
  
router.get('/:id', async (req, res) => {
    try {
        const yiyecek = await Yiyecek.findById(req.params.id);
        if (!yiyecek) {
            return res.status(404).json({ hata: "Yiyecek bulunamadı" });
        }
        res.json(yiyecek);
    } catch (e) {
        res.status(500).json({ hata: e.message });
    }
});

//yiyecek kaydet
router.post('/', async (req, res) => {
    try {
        const yeniyiyecek = new Yiyecek({
            ...req.body,
            olusturulmatarihi: new Date,
            songuncellenmetarihi:new Date
        })

        const kaydedilen = await yeniyiyecek.save()
        res.status(201).json(kaydedilen)


    } catch (e) {
      res.status(400).json({hata:e.message})
    }
})

router.put('/:id', async (req, res) => {
    try {
        const guncellenmis = await Yiyecek.findByIdAndUpdate(
            req.params.id,
            {
                ...req.body,
                songuncellenmetarihi: new Date()
                
            },
            {
                new :true
            }
        )
        res.json(guncellenmis)
    } catch (e) {
        res.status(400).json({hata:e.message})
    }
}) 

// routes/yiyecekler.js
router.delete("/:id", async (req, res) => {
    try {
      await Yiyecek.findByIdAndDelete(req.params.id);
      res.status(204).send();
    } catch (err) {
      res.status(500).json({ error: "Silme işlemi başarısız" });
    }
});
  




// Remove this duplicate and buggy route definition.
// If you want to keep the paginated search, merge it with the first router.get('/') route and ensure only one definition exists.
// Here is a corrected version for paginated search and listing:


// routes/food.js
// backend /routes/yiyecekler.js

module.exports = router;





