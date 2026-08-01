const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const prisma = require("../config/db");

exports.register = async (req, res) => {
  try {
    const { email, password, fullName } = req.body;

    // Kiểm tra email tồn tại
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser)
      return res.status(400).json({ message: "Email had been used!!!" });

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Lưu DB
    const user = await prisma.user.create({
      data: { email, password: hashedPassword, fullName },
    });

    res.status(201).json({ message: "Successfully", userId: user.id });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) return res.status(404).json({ message: "User not found!!!" });

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword)
      return res.status(401).json({ message: "Password is wrong!!" });

    // Tạo JWT
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || "7d" },
    );

    res.json({
      message: "Successfully",
      token,
      email: user.email, // <-- Trả về email
      createdAt: user.createdAt,
      user: { id: user.id, fullName: user.fullName },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

const hashResetToken = (token) =>
  crypto.createHash("sha256").update(token).digest("hex");

exports.requestPasswordReset = async (req, res, next) => {
  try {
    const genericMessage = "Nếu email tồn tại, bạn sẽ nhận được liên kết đặt lại mật khẩu.";
    const user = await prisma.user.findUnique({ where: { email: req.body.email } });

    if (!user) return res.status(200).json({ message: genericMessage });

    if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM || !process.env.FRONTEND_URL) {
      const error = new Error("Dịch vụ gửi email chưa được cấu hình");
      error.statusCode = 503;
      throw error;
    }

    const token = crypto.randomBytes(32).toString("hex");
    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpires: new Date(Date.now() + 15 * 60 * 1000),
      },
    });

    const resetUrl = `${process.env.FRONTEND_URL.replace(/\/$/, "")}/forgotpassword?token=${token}`;
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.EMAIL_FROM,
        to: [user.email],
        subject: "Đặt lại mật khẩu Study Planner",
        html: `<p>Xin chào ${user.fullName},</p><p>Liên kết này có hiệu lực trong 15 phút:</p><p><a href="${resetUrl}">Đặt lại mật khẩu</a></p><p>Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>`,
      }),
    });

    if (!emailResponse.ok) {
      await prisma.user.update({
        where: { id: user.id },
        data: { resetTokenHash: null, resetTokenExpires: null },
      });
      const error = new Error("Không thể gửi email đặt lại mật khẩu");
      error.statusCode = 502;
      throw error;
    }

    return res.status(200).json({ message: genericMessage });
  } catch (error) {
    next(error);
  }
};

exports.resetPassword = async (req, res, next) => {
  try {
    const { token, newPassword } = req.body;
    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: hashResetToken(token),
        resetTokenExpires: { gt: new Date() },
      },
    });

    if (!user) {
      return res.status(400).json({ message: "Liên kết không hợp lệ hoặc đã hết hạn" });
    }

    const password = await bcrypt.hash(newPassword, 10);
    await prisma.user.update({
      where: { id: user.id },
      data: { password, resetTokenHash: null, resetTokenExpires: null },
    });

    res.status(200).json({ message: "Đặt lại mật khẩu thành công" });
  } catch (error) {
    next(error);
  }
};
// Cập nhật mật khẩu khi người dùng ĐÃ ĐĂNG NHẬP (Sử dụng JWT Token)
exports.changePassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    // 1. Lấy thông tin người dùng từ DB dựa vào req.user.id
    // (req.user.id có được là nhờ middleware verifyToken đã giải mã JWT)
    const user = await prisma.user.findUnique({
      where: { email: email },
    });

    if (!user) {
      return res
        .status(404)
        .json({ message: "Không tìm thấy tài khoản với email này" });
    }

    if (user.id !== req.user.id) {
      return res.status(403).json({
        message:
          "Lỗi bảo mật: Bạn không có quyền đổi mật khẩu của tài khoản này",
      });
    }
    //tiến hành mã hóa (Hash) mật khẩu mới
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // 4. Lưu mật khẩu mới vào Database
    await prisma.user.update({
      where: { id: req.user.id },
      data: { password: hashedPassword },
    });

    res.status(200).json({ message: "Success!!!" });
  } catch (error) {
    next(error);
  }
};
