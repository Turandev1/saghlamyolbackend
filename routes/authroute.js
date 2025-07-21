const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authmiddleware");
const authcontroller = require('../controllers/authcontroller');
const User = require('../models/User');

// Ensure all controller methods exist and are exported in authcontroller
router.post("/signup", authcontroller.signup);
router.post("/login", authcontroller.login);

router.get('/profile', authenticateUser, authcontroller.getProfile);
router.post('/profile', authenticateUser, authcontroller.updateUserinfo);

// Kullanıcı var mı diye kontrol et
router.get('/me', authenticateUser, authcontroller.getMe);
router.put('/update', authenticateUser, authcontroller.updateUserinfo);
router.put('/update',authenticateUser,authcontroller.updateuserpassword)
// Günlük kalori verilerini alma
router.get('/dailycalories/:userId', authcontroller.getcalories);

module.exports = router;
