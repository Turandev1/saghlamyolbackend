const express = require("express");
const router = express.Router();
const authenticateUser = require("../middleware/authmiddleware");
const authcontroller = require("../controllers/authcontroller");

// Ensure all controller methods exist and are exported in authcontroller
router.post("/signup", authcontroller.signup);
router.post("/login", authcontroller.login);

router.get("/profile", authenticateUser, authcontroller.getProfile);
router.post("/profile", authenticateUser, authcontroller.updateUserinfo);

// Kullanıcı var mı diye kontrol et
router.get("/me", authenticateUser, authcontroller.getme);
router.put("/update", authenticateUser, authcontroller.updateUserinfo);
router.put(
  "/updatepassword",
  authenticateUser,
  authcontroller.updateuserpassword
);
router.post("/deleteaccount", authenticateUser, authcontroller.deleteaccount);




// Günlük kalori verilerini alma
router.get("/dailycalories/:userId", authcontroller.getcalories);
router.get('/:userId/weekly-calories',authenticateUser, authcontroller.getweeklyfooddetails)
router.delete(
  "/dailycalories/:userId/deletefood/:id",
  authcontroller.deletefood
);
module.exports = router;
