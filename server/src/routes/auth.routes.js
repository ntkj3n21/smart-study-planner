const express = require("express");
const router = express.Router();
const authController = require("../controllers/auth.controller");
const verifyToken = require("../middlewares/auth.middleware");
const {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  requestPasswordResetValidator,
  resetPasswordValidator,
} = require("../validations/auth.validator");

// Gắn Validator TRƯỚC khi gọi Controller
router.post("/register", registerValidator, authController.register); //dang ky

router.post("/login", loginValidator, authController.login); //dang nhap

router.post("/forgot-password", requestPasswordResetValidator, authController.requestPasswordReset);
router.post("/reset-password", resetPasswordValidator, authController.resetPassword);
router.put("/change-password", verifyToken, changePasswordValidator, authController.changePassword);

module.exports = router;
