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
exports.updateProfile = async (req, res) => {
  const { yas, boy, kilo, cinsiyet, hedefkilo, hedefkiloTipi, hedefkalori } =
    req.body;

  

  if (!req.userId) {
    return res.status(401).json({ hata: "İstifadəçi doğrulama uğursuzdur" });
  }


  try {
    const user = await User.findById(req.userId);
    if (!user) return res.status(404).json({ hata: "İstifadəçi tapılmadı" });

    if (yas !== undefined) user.yas = Number(yas);
    if (boy !== undefined) user.boy = Number(boy);
    if (kilo !== undefined) user.kilo = Number(kilo);
    if (cinsiyet !== undefined) user.cinsiyet = cinsiyet;
    if (hedefkilo !== undefined) user.hedefkilo = Number(hedefkilo);
    if (hedefkiloTipi !== undefined) user.hedefkiloTipi = hedefkiloTipi;
    if (hedefkalori !== undefined) user.hedefkalori = Number(hedefkalori);

    await user.save();

    res.status(200).json({ mesaj: "Profil yeniləndi", profil: user });
  } catch (err) {
    res.status(500).json({ hata: "Server xətası" });
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

