const { body, validationResult } = require("express-validator");

const runValidation = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      message: "Dữ liệu đầu vào không hợp lệ",
      errors: errors.array(),
    });
  }
  next();
};

const registerValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Email không đúng định dạng"),
  body("password")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu phải có ít nhất 6 ký tự")
    .matches(/\d/)
    .withMessage("Mật khẩu phải chứa ít nhất 1 chữ số"),

  // BỔ SUNG KIỂM TRA CONFIRM PASSWORD TẠI ĐÂY
  body("confirmPassword")
    .notEmpty()
    .withMessage("Vui lòng nhập lại mật khẩu xác nhận")
    .custom((value, { req }) => {
      // Đối chiếu giá trị confirmPassword (value) với password trong req.body
      if (value !== req.body.password) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true; // Hợp lệ
    }),

  body("fullName").trim().notEmpty().withMessage("Họ tên không được để trống"),

  runValidation,
];

const loginValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Email không đúng định dạng"),
  body("password").notEmpty().withMessage("Vui lòng nhập mật khẩu"),
  runValidation,
];
const changePasswordValidator = [
  body("email").trim().isEmail().withMessage("Email không đúng định dạng"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
    .matches(/\d/)
    .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số"),
  body("confirmNewPassword")
    .notEmpty()
    .withMessage("Vui lòng nhập lại mật khẩu xác nhận")
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error("Mật khẩu xác nhận không khớp");
      }
      return true;
    }),
  runValidation,
];

const requestPasswordResetValidator = [
  body("email").trim().isEmail().normalizeEmail().withMessage("Email không đúng định dạng"),
  runValidation,
];

const resetPasswordValidator = [
  body("token").isString().isLength({ min: 32 }).withMessage("Token không hợp lệ"),
  body("newPassword")
    .isLength({ min: 6 })
    .withMessage("Mật khẩu mới phải có ít nhất 6 ký tự")
    .matches(/\d/)
    .withMessage("Mật khẩu mới phải chứa ít nhất 1 chữ số"),
  body("confirmNewPassword").custom((value, { req }) => {
    if (value !== req.body.newPassword) throw new Error("Mật khẩu xác nhận không khớp");
    return true;
  }),
  runValidation,
];

module.exports = {
  registerValidator,
  loginValidator,
  changePasswordValidator,
  requestPasswordResetValidator,
  resetPasswordValidator,
};
