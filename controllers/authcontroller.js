const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const nodemailer = require("nodemailer");

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
    return res
      .status(400)
      .json({ hata: "Bütün məcburi sahələr doldurulmalıdır" });
  }

  if (password !== confirmPassword) {
    return res.status(400).json({ hata: "Parollar uyğun deyil" });
  }

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    return res
      .status(400)
      .json({ hata: "Bu istifadəçi mövcuddur. Giriş edin" });
  }

  const hashedPassword = await bcrypt.hash(password, 10);

  const newUser = new User({
    username,
    email,
    password: hashedPassword,
    yas,
    boy,
    kilo,
    cinsiyet,
    hedefkilo,
    hedefkiloTipi,
    hedefkalori,
    verified: false, // başlangıçta false
  });

  await newUser.save();

  const token = jwt.sign({ email }, process.env.JWT_SECRET, {
    expiresIn: "1h",
  });

  const verifyUrl = `https://saghlamyolbackend.onrender.com/api/auth/verify-email?token=${token}`;
  console.log("Doğrulama linki:", verifyUrl);

  const transporter = nodemailer.createTransport({
    service: "Gmail",
    auth: {
      user: process.env.GMAIL_USER,
      pass: process.env.GMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.GMAIL_USER,
    to: email,
    subject: "Email Doğrulama",
    html: `<p>Qeydiyyatınızı tamamlamaq üçün aşağıdakı linkə klikləyin:</p><a href="${verifyUrl}">Emaili Təsdiqlə</a>`,
  };

  try {
    await transporter.sendMail(mailOptions);
    return res
      .status(200)
      .json({ mesaj: "Doğrulama linki email hesabınıza göndərildi" });
  } catch (error) {
    console.error("Email göndərmə xətası:", error);
    return res.status(500).json({ hata: "Email göndərilərkən xəta baş verdi" });
  }
};

//verify
exports.verifyEmail = async (req, res) => {
  const { token } = req.query;

  if (!token) {
    return res.status(400).json({ hata: "Token tələb olunur" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { email } = decoded;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ hata: "İstifadəçi tapılmadı" });
    }

    if (user.verified) {
      return res.status(400).json({ hata: "Email artıq təsdiqlənib" });
    }

    user.verified = true;
    await user.save();

    return res
      .status(200)
      .json({ mesaj: "Email təsdiqləndi, qeydiyyat tamamlandı" });
  } catch (error) {
    console.error("Token doğrulama xətası:", error);
    return res
      .status(400)
      .json({ hata: "Token etibarsız və ya vaxtı keçmişdir" });
  }
};

// Giriş
exports.login = async (req, res) => {
  const { email, password } = req.body;

  // 📌 Boş alan kontrolü
  if (!email || !password) {
    return res.status(400).json({ hata: "Email və parol tələb olunur" });
  }

  try {
    const user = await User.findOne({ email });

    // 📌 İstifadəçi yoxdursa
    if (!user) {
      return res.status(401).json({ hata: "Email və ya parol yanlışdır" });
    }

    // 📌 Email təsdiqlənməyibsə
    if (!user.verified) {
      return res.status(403).json({
        hata: "Email hələ təsdiqlənməyib. Zəhmət olmasa email adresinizi yoxlayın.",
      });
    }

    // 📌 Parolun doğruluğunu yoxla
    const isMatch = await bcrypt.compare(password, user.password);

    if (!isMatch) {
      return res.status(401).json({ hata: "Email və ya parol yanlışdır" });
    }

    // 📌 JWT token yaradılır
    const token = jwt.sign({ userId: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    });

    // ✅ Giriş uğurludur
    return res.status(200).json({
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
    console.error("Giriş xətası:", err);
    return res.status(500).json({ hata: "Server xətası baş verdi" });
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
    kilo,
    boy,
    hedefkilo,
    hedefkiloTipi,
    hedefkalori,
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
    if (boy !== undefined) user.boy = Number(boy);
    if (kilo !== undefined) user.kilo = Number(kilo);
    if (hedefkilo !== undefined) user.hedefkilo = Number(hedefkilo);
    if (hedefkalori !== undefined) user.hedefkalori = Number(hedefkalori);
    if (hedefkiloTipi !== undefined) user.hedefkiloTipi = hedefkiloTipi;

    await user.save();

    res.status(200).json({ mesaj: "Profil yeniləndi", profil: user });
  } catch (err) {
    console.error("Update hatası:", err);
    res.status(500).json({ hata: "Server xətası" });
  }
};

exports.updateuserpassword = async (req, res) => {
  const { currentPassword, newPassword } = req.body;

  if (!currentPassword || !newPassword) {
    return res.status(400).json({ hata: "Köhne və yeni şifrələr məcburidir" });
  }

  if (!req.userId) {
    return res.status(401).json({ hata: "Istifadəçi dogrulama ugursuzdur" });
  }

  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(401).json({ hata: "Istifadəçi tapilmadi" });
    }

    const ismatch = await bcrypt.compare(currentPassword, user.password);
    if (!ismatch) {
      return res.status(401).json({ hata: "Mövcud şifrə yanlışdır" });
    }

    const hashednewpassword = await bcrypt.hash(newPassword, 10);
    user.password = hashednewpassword;
    await user.save();

    return res.status(200).json({ mesaj: "Şifrə uğurla yeniləndi" });
  } catch (error) {
    console.error("Şifrə yeniləmə xətasi", error);
    res.status(500).json({ hata: "Server xetasi bas verdi" });
  }
};

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
  const { userId, id } = req.params;
  try {
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "Istifadeci tapilmadi" });
    }

    let deleted = false;
    for (let i = 0; i < user.dailycalories.length; i++) {
      const day = user.dailycalories[i];
      const initiallength = day.entries.length;
      day.entries = day.entries.filter((entry) => entry._id.toString() !== id);

      if (day.entries.length < initiallength) {
        deleted = true;
        break;
      }
    }

    if (!deleted) {
      return res.status(404).json({ hata: "Qida qeydi tapilmadi" });
    }

    await user.save();

    res.status(200).json({ message: "Qida ugurla silindi" });
  } catch (error) {
    console.error("Silinerken xeta bas verdi", error);
    res.status(500).json({ message: "Server xetasi" });
  }
};

exports.deleteaccount = async (req, res) => {
  const { username, email, password } = req.body;
  const userId = req.userId;
  if (!username || !email || !password) {
    return res.status(400).json({ message: "Bütün sahələri doldurun" });
  }

  try {
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Istifadəçi tapılmadı" });
    }

    const errors = [];

    if (user.username !== username) errors.push("Istifadəçi adı səhvdir");
    if (user.email !== email) errors.push("Email sehvdir");
    const ispasswordcorrect = await bcrypt.compare(password, user.password);
    console.log(password);
    if (!ispasswordcorrect) errors.push("Parol sehvdir");

    if (errors.length > 0) {
      return res.status(400).json({ message: "Uyğunlaşdırma xətası", errors });
    }

    await User.findByIdAndDelete(userId);
    res.status(200).json({ message: "Hesab uğurla silindi" });
  } catch (error) {
    console.error("Hesab silinerken xeta bas verdi", error);
    return res.status(500).json({ message: "Server xetasi" });
  }
};
