const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");

// Kayıt
exports.signup = async (req, res) => {
  const {
    username,
    email,
    password,
    confirmPassword,
    yas,
    boy,
    kilo,
    cinsiyet,
    hedefkilo,
    hedefkiloTipi,
    hedefkalori,
  } = req.body;

  if (!username || !email || !password || !confirmPassword) {
    return res.status(400).json({ hata: "Tüm məcburi sahələr doldurulmalıdır" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ hata: "Parollar uyğun deyil" });
  }

  const existingUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existingUser) {
    return res
      .status(400)
      .json({ hata: "Bu istifadəçi mövcuddur. Giriş edin." });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    yas: yas || 0,
    boy: boy || 0,
    kilo: kilo || 0,
    cinsiyet: cinsiyet || null,
    hedefkilo: hedefkilo || 0,
    hedefkiloTipi: hedefkiloTipi || "koru",
    hedefkalori: hedefkalori || 0,
  });

  try {
    await newUser.save();

    return res.status(201).json({
      mesaj: "Qeydiyyat uğurla başa çatdı. Giriş edə bilərsiniz.",
      userId: newUser._id,
    });
  } catch (error) {
    console.error("Qeydiyyat xətası:", error);
    return res.status(500).json({ hata: "Qeydiyyat zamanı xəta baş verdi " });
  }
};

// Giriş
exports.login = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ hata: "Email ve parol məcburidir" });
  }

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ hata: "İstifadəçi tapılmadı" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ hata: "Parol yanlışdır" });
    }

    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    res.status(200).json({
      mesaj: "Uğurla giriş edildi",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        yas: user.yas,
        boy: user.boy,
        kilo: user.kilo,
        cinsiyet: user.cinsiyet,
        hedefkilo: user.hedefkilo,
        hedefkiloTipi: user.hedefkiloTipi,
        hedefkalori: user.hedefkalori,
      },
    });
  } catch (err) {
    console.error("Giriş hatası:", err);
    res.status(500).json({ hata: "Sunucu hatası" });
  }
};

// Profil görüntüleme
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    res.status(200).json({ profil: user });
  } catch (err) {
    res.status(500).json({ hata: "Server xətası" });
  }
};

// Profil güncelleme
exports.updateUserinfo = async (req, res) => {
  const {
    username,
    email,
    yas,
    cinsiyet,

  } = req.body;

  if (!req.userId) {
    return res.status(401).json({ hata: "İstifadəçi doğrulama uğursuzdur" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ hata: "İstifadəçi tapılmadı" });

    // ✅ Kullanıcı adı zaten var mı kontrolü (kendisi hariç)
    if (username && username !== user.username) {
      const existingUser = await User.findOne({ username });
      if (existingUser && existingUser._id.toString() !== req.userId) {
        return res
          .status(400)
          .json({ hata: "Bu istifadəçi adı artıq mövcuddur" });
      }
      user.username = username;
    }

    // ✅ Email kontrolü – format ve benzersizlik (isteğe bağlı)
    if (email && email !== user.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res
          .status(400)
          .json({ hata: "Zəhmət olmasa düzgün email daxil edin" });
      }
      user.email = email;
    }

    if (yas !== undefined) user.yas = Number(yas);
    if (cinsiyet !== undefined) user.cinsiyet = cinsiyet;
    

    await user.save();

    res.status(200).json({ mesaj: "Profil yeniləndi", profil: user });
  } catch (err) {
    console.error("Update hatası:", err);
    res.status(500).json({ hata: "Server xətası" });
  }
};


exports.updateuserpassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body
  

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ hata: 'Köhne və yeni şifrələr məcburidir' })
  }

  if (!req.userId) {
    return res.status(401).json({ hata: 'Istifadəçi dogrulama ugursuzdur' })
  }



  try {
    const user = await User.findById(req.userId)
    if (!user) {
      return res.status(401).json({ hata: 'Istifadəçi tapilmadi' })
    }

    const ismatch = await bcrypt.compare(currentPassword, user.password)
    if (!ismatch) {
      return res.status(401).json({hata :'Mövcud şifrə yanlışdır'})
    }

    const hashednewpassword = await bcrypt.hash(newPassword, 10)
    user.password = hashednewpassword
   await user.save()

    return res.status(200).json({mesaj:'Şifrə uğurla yeniləndi'})
  } catch (error) {
    console.error("Şifrə yeniləmə xətasi", error);
    res.status(500).json({hata:'Server xetasi bas verdi'})
  }
}


// Kullanıcı verisini döndürme (TOKEN ile)
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select("-password");
    if (!user) return res.status(404).json({ hata: "İstifadəçi tapılmadı" });

    res.status(200).json({ user });
  } catch (err) {
    res.status(500).json({ hata: "Server xətası" });
  }
};




// routes/user.js
exports.getcalories = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);

    if (!user) return res.status(404).json({ message: "İstifadəçi tapılmadı" });

    res.json(user.dailycalories);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server xətası" });
  }
};



exports.deletefood = async (req, res) => {
  const { userId, id } = req.params
  try {
    const user = await User.findById(userId)
    
    if (!user) {
      return res.status(404).json({ message: "Istifadeci tapilmadi" })
    }


    let deleted = false
    for (let i = 0; i < user.dailycalories.length; i++){
      const day = user.dailycalories[i]
      const initiallength = day.entries.length
      day.entries = day.entries.filter((entry) => entry._id.toString() !== id)
      
      if (day.entries < initiallength) {
        deleted = true
        break
      }
    }


    if (!deleted) {
      return res.status(404).json({hata:"Qida qeydi tapilmadi"})
    }


    await user.save()

    res.status(200).json({message:"Qida ugurla silindi"})

  } catch (error) {
    console.error("Silinerken xeta bas verdi", error);
    res.status(500).json({message:"Server xetasi"})
  }
}