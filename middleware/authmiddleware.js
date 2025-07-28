// middleware/authMiddleware.js
const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  const authHeader = req.headers.authorization;
console.log('authheader',authHeader)
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ hata: "Yetkilendirme reddedildi" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.userId;
    console.log('decoded', decoded);
    next();
  } catch (err) {
    return res.status(401).json({ hata: "Geçersiz token" });
  }
};

module.exports = authMiddleware;
