const prisma = require("../config/db");

// Lấy danh sách môn học của sinh viên đang đăng nhập
// exports.getSubjects = async (req, res, next) => {
//   try {
//     const subjects = await prisma.subject.findMany({
//       where: { userId: req.user.id },
//       orderBy: { createdAt: "desc" },
//       // Tùy chọn: include thêm số lượng task đang mở của môn này để hiển thị trên Dashboard
//       include: {
//         _count: {
//           select: { tasks: { where: { status: { not: "DONE" } } } },
//         },
//       },
//     });
//     res.status(200).json(subjects);
//   } catch (error) {
//     next(error); // Đẩy lỗi về Global Error Handler
//   }
// };

// 1. LẤY DANH SÁCH MÔN HỌC (Giữ nguyên logic tính toán progress của bạn)
exports.getAllSubjects = async (req, res, next) => {
  try {
    const subjects = await prisma.subject.findMany({
      where: { userId: req.user.id },
      include: {
        tasks: { select: { status: true } },
      },
    });

    const subjectsWithProgress = subjects.map((subject) => {
      const totalTasks = subject.tasks.length;
      const completedTasks = subject.tasks.filter((task) => task.status === "DONE").length;
      const progressPercentage = totalTasks === 0 ? 0 : Math.round((completedTasks / totalTasks) * 100);

      const { tasks, ...subjectData } = subject;

      return {
        ...subjectData,
        totalTasks: totalTasks,
        completedTasks: completedTasks,
        progress: progressPercentage, 
      };
    });

    res.status(200).json({
      message: "Lấy danh sách môn học thành công",
      totalSubjects: subjectsWithProgress.length,
      data: subjectsWithProgress,
    });
  } catch (error) {
    next(error);
  }
};

// 2. THÊM MÔN HỌC MỚI (Đã sửa để khớp với FE)
exports.createSubject = async (req, res, next) => {
  try {
    const { name, target, weeklyStudyHours, icon, color, colorCode } = req.body;
    const normalizedName = String(name || "").trim();
    const parsedHours = Number.parseInt(weeklyStudyHours ?? target, 10);

    if (!normalizedName) {
      return res.status(400).json({ message: "Tên môn học không được để trống" });
    }
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 168) {
      return res.status(400).json({ message: "Mục tiêu học phải từ 1 đến 168 giờ mỗi tuần" });
    }

    const existingSubject = await prisma.subject.findFirst({
      where: {
        userId: req.user.id,
        name: { equals: normalizedName, mode: "insensitive" },
      },
    });
    if (existingSubject) {
      return res.status(409).json({ message: "Môn học này đã tồn tại" });
    }

    const newSubject = await prisma.subject.create({
      data: {
        name: normalizedName,
        weeklyStudyHours: parsedHours,
        colorCode: colorCode || color || "#2563EB",
        icon: String(icon || "📚").trim().slice(0, 8) || "📚",
        userId: req.user.id,
      },
    });

    res.status(201).json({
      success: true,
      data: newSubject
    });
  } catch (error) {
    // In lỗi ra terminal để bạn dễ theo dõi nếu vẫn còn lỗi database
    console.error("Prisma Error:", error);
    next(error);
  }
};

// 3. CẬP NHẬT MÔN HỌC
exports.updateSubject = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, target, weeklyStudyHours, color, colorCode, icon } = req.body;
    const parsedHours = Number.parseInt(weeklyStudyHours ?? target, 10);
    const normalizedName = String(name || "").trim();

    if (!normalizedName) {
      return res.status(400).json({ message: "Tên môn học không được để trống" });
    }
    if (!Number.isInteger(parsedHours) || parsedHours < 1 || parsedHours > 168) {
      return res.status(400).json({ message: "Mục tiêu học phải từ 1 đến 168 giờ mỗi tuần" });
    }

    const subject = await prisma.subject.updateMany({
      where: { id: id, userId: req.user.id },
      data: { 
        name: normalizedName,
        weeklyStudyHours: parsedHours,
        colorCode: colorCode || color || undefined,
        icon: icon ? String(icon).trim().slice(0, 8) : undefined,
      },
    });

    if (subject.count === 0) {
      return res.status(404).json({ message: "Không tìm thấy môn học" });
    }

    res.status(200).json({ message: "Cập nhật thành công" });
  } catch (error) {
    next(error);
  }
};

// 4. XÓA MÔN HỌC
exports.deleteSubject = async (req, res, next) => {
  try {
    const { id } = req.params;

    // Dùng deleteMany để kết hợp điều kiện: Chỉ xóa môn học CỦA ĐÚNG USER ĐÓ
    const deletedSubject = await prisma.subject.deleteMany({
      where: { 
        id: id, 
        userId: req.user.id 
      },
    });

    // Nếu count === 0 nghĩa là ID không tồn tại hoặc user đang cố xóa môn của người khác
    if (deletedSubject.count === 0) {
      return res.status(404).json({ 
        message: "Không tìm thấy môn học hoặc bạn không có quyền xóa" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Xóa môn học thành công" 
    });
  } catch (error) {
    console.error("Lỗi khi xóa môn học:", error);
    next(error);
  }
};
