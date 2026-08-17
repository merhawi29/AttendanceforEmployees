import prisma from "../config/database";
import { TrainingStatus, EnrollmentStatus, Prisma, NotificationType } from "@prisma/client";
import { AppError } from "../utils/response";
import { notificationService } from "./notification.service";

export interface CreateProgramInput {
  code: string;
  title: string;
  description: string;
  category?: string;
  trainerName?: string;
  location?: string;
  materialsUrl?: string;
  startDate: string;
  endDate: string;
  capacity?: number;
  status?: TrainingStatus;
}

export interface EnrollEmployeeInput {
  trainingProgramId: string;
  employeeId: string;
  status?: EnrollmentStatus;
  notes?: string;
  remarks?: string;
}

export interface ApplyTrainingInput {
  trainingProgramId: string;
  employeeId: string;
}

export interface CompleteEnrollmentInput {
  score?: number;
  certificateUrl?: string;
  certificateNo?: string;
  completionDate?: string;
  feedback?: string;
  remarks?: string;
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus;
  score?: number;
  certificateUrl?: string;
  certificateNo?: string;
  issueDate?: string;
  feedback?: string;
  remarks?: string;
}

export const trainingService = {
  // --- TRAINING PROGRAMS ---
  async createProgram(data: CreateProgramInput) {
    const existing = await prisma.trainingProgram.findUnique({ where: { code: data.code } });
    if (existing) {
      throw new AppError(409, "Training Program code already exists", undefined, "DUPLICATE_PROGRAM_CODE");
    }

    return prisma.trainingProgram.create({
      data: {
        code: data.code,
        title: data.title,
        description: data.description,
        category: data.category || "Technical",
        trainerName: data.trainerName || null,
        location: data.location || null,
        materialsUrl: data.materialsUrl || null,
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity || 20,
        status: data.status || TrainingStatus.OPEN,
      },
      include: {
        _count: { select: { enrollments: true } },
      },
    });
  },

  async updateProgram(programId: string, data: Partial<CreateProgramInput>) {
    const program = await prisma.trainingProgram.findUnique({ where: { id: programId } });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }

    const updateData: Prisma.TrainingProgramUpdateInput = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.category !== undefined) updateData.category = data.category;
    if (data.trainerName !== undefined) updateData.trainerName = data.trainerName;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.materialsUrl !== undefined) updateData.materialsUrl = data.materialsUrl;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.capacity !== undefined) updateData.capacity = data.capacity;
    if (data.status !== undefined) updateData.status = data.status;

    return prisma.trainingProgram.update({
      where: { id: programId },
      data: updateData,
      include: {
        _count: { select: { enrollments: true } },
      },
    });
  },

  async deleteProgram(programId: string) {
    const program = await prisma.trainingProgram.findUnique({ where: { id: programId } });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }
    return prisma.trainingProgram.delete({ where: { id: programId } });
  },

  async getPrograms(query: { status?: TrainingStatus; category?: string; search?: string }) {
    const where: Prisma.TrainingProgramWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.category) where.category = query.category;
    if (query.search) {
      where.OR = [
        { code: { contains: query.search } },
        { title: { contains: query.search } },
        { category: { contains: query.search } },
        { trainerName: { contains: query.search } },
      ];
    }

    return prisma.trainingProgram.findMany({
      where,
      include: {
        _count: { select: { enrollments: true } },
      },
      orderBy: { startDate: "desc" },
    });
  },

  async getProgramById(programId: string) {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: programId },
      include: {
        enrollments: {
          include: {
            employee: { select: { id: true, name: true, employeeId: true, email: true, department: true } },
            approvedBy: { select: { id: true, name: true, email: true } },
          },
          orderBy: { enrolledDate: "desc" },
        },
      },
    });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }
    return program;
  },

  // --- EMPLOYEE APPLICATION & WORKFLOW ---
  async applyTraining(data: ApplyTrainingInput) {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: data.trainingProgramId },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.COMPLETED, EnrollmentStatus.ENROLLED] } },
            },
          },
        },
      },
    });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }

    if (program.status === TrainingStatus.CLOSED || program.status === TrainingStatus.CANCELLED) {
      throw new AppError(400, "This training program is closed for enrollment", undefined, "PROGRAM_CLOSED");
    }

    if (program._count.enrollments >= program.capacity) {
      throw new AppError(400, "Training Program has reached maximum capacity", undefined, "PROGRAM_FULL");
    }

    const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const existing = await prisma.trainingEnrollment.findFirst({
      where: {
        trainingProgramId: data.trainingProgramId,
        employeeId: data.employeeId,
      },
    });

    if (existing) {
      if (existing.status === EnrollmentStatus.PENDING) {
        throw new AppError(409, "You have already submitted an enrollment request for this training", undefined, "DUPLICATE_APPLICATION");
      }
      if (
        existing.status === EnrollmentStatus.APPROVED ||
        existing.status === EnrollmentStatus.ENROLLED ||
        existing.status === EnrollmentStatus.COMPLETED
      ) {
        throw new AppError(409, "You are already enrolled or have completed this training program", undefined, "ALREADY_ENROLLED");
      }
      if (existing.status === EnrollmentStatus.REJECTED) {
        const updated = await prisma.trainingEnrollment.update({
          where: { id: existing.id },
          data: {
            status: EnrollmentStatus.PENDING,
            appliedAt: new Date(),
            approvedAt: null,
            approvedById: null,
            remarks: null,
          },
          include: {
            trainingProgram: { select: { id: true, code: true, title: true } },
            employee: { select: { id: true, name: true, employeeId: true } },
          },
        });

        try {
          await notificationService.broadcastNotification({
            title: "Training Enrollment Request",
            message: `Employee ${employee.name} re-applied for training program: ${program.title}`,
            type: NotificationType.TRAINING,
            link: "/admin/training/enrollments",
            targetRole: "ADMIN",
          });
        } catch (e) {}

        return updated;
      }
    }

    const newEnrollment = await prisma.trainingEnrollment.create({
      data: {
        trainingProgramId: data.trainingProgramId,
        employeeId: data.employeeId,
        status: EnrollmentStatus.PENDING,
        appliedAt: new Date(),
      },
      include: {
        trainingProgram: { select: { id: true, code: true, title: true } },
        employee: { select: { id: true, name: true, employeeId: true } },
      },
    });

    try {
      await notificationService.broadcastNotification({
        title: "New Training Enrollment Request",
        message: `Employee ${employee.name} applied for training program: ${program.title}`,
        type: NotificationType.TRAINING,
        link: "/admin/training/enrollments",
        targetRole: "ADMIN",
      });
    } catch (e) {}

    return newEnrollment;
  },

  // --- ADMIN APPROVAL WORKFLOW ---
  async approveEnrollment(enrollmentId: string, adminId: string, remarks?: string) {
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        trainingProgram: true,
        employee: true,
      },
    });

    if (!enrollment) {
      throw new AppError(404, "Training enrollment request not found", undefined, "ENROLLMENT_NOT_FOUND");
    }

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.APPROVED,
        approvedAt: new Date(),
        approvedById: adminId,
        remarks: remarks || "Enrollment request approved by Admin.",
      },
      include: {
        trainingProgram: true,
        employee: { select: { id: true, name: true, employeeId: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    try {
      await notificationService.createNotification({
        userId: enrollment.employeeId,
        title: "Training Application Approved",
        message: `Your enrollment application for training "${enrollment.trainingProgram.title}" has been APPROVED. Training materials are now accessible.`,
        type: NotificationType.TRAINING,
        link: "/employee/training",
      });
    } catch (e) {}

    return updated;
  },

  async rejectEnrollment(enrollmentId: string, adminId: string, remarks?: string) {
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        trainingProgram: true,
      },
    });

    if (!enrollment) {
      throw new AppError(404, "Training enrollment request not found", undefined, "ENROLLMENT_NOT_FOUND");
    }

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.REJECTED,
        approvedAt: new Date(),
        approvedById: adminId,
        remarks: remarks || "Enrollment request declined by Admin.",
      },
      include: {
        trainingProgram: true,
        employee: { select: { id: true, name: true, employeeId: true, email: true } },
        approvedBy: { select: { id: true, name: true, email: true } },
      },
    });

    try {
      await notificationService.createNotification({
        userId: enrollment.employeeId,
        title: "Training Application Declined",
        message: `Your enrollment request for "${enrollment.trainingProgram.title}" was rejected.${remarks ? ` Reason: ${remarks}` : ""}`,
        type: NotificationType.TRAINING,
        link: "/employee/training",
      });
    } catch (e) {}

    return updated;
  },

  async completeEnrollment(enrollmentId: string, adminId: string, data: CompleteEnrollmentInput) {
    const enrollment = await prisma.trainingEnrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        trainingProgram: true,
      },
    });

    if (!enrollment) {
      throw new AppError(404, "Training enrollment request not found", undefined, "ENROLLMENT_NOT_FOUND");
    }

    const compDate = data.completionDate ? new Date(data.completionDate) : new Date();
    const certNo = data.certificateNo || `CERT-TRN-${Math.floor(100000 + Math.random() * 900000)}`;

    const updated = await prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: {
        status: EnrollmentStatus.COMPLETED,
        completionDate: compDate,
        score: data.score !== undefined ? data.score : 100,
        certificateNo: certNo,
        certificateUrl: data.certificateUrl || null,
        issueDate: compDate,
        feedback: data.feedback || null,
        remarks: data.remarks || "Training marked completed.",
      },
      include: {
        trainingProgram: true,
        employee: { select: { id: true, name: true, employeeId: true } },
      },
    });

    try {
      await notificationService.createNotification({
        userId: enrollment.employeeId,
        title: "Training Completed 🎉",
        message: `Congratulations! You have completed training "${enrollment.trainingProgram.title}". Certificate #${certNo} issued.`,
        type: NotificationType.TRAINING,
        link: "/employee/training",
      });
    } catch (e) {}

    return updated;
  },

  async enrollEmployee(data: EnrollEmployeeInput) {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: data.trainingProgramId },
    });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }

    const existing = await prisma.trainingEnrollment.findFirst({
      where: { trainingProgramId: data.trainingProgramId, employeeId: data.employeeId },
    });

    if (existing) {
      return prisma.trainingEnrollment.update({
        where: { id: existing.id },
        data: {
          status: data.status || EnrollmentStatus.APPROVED,
          approvedAt: new Date(),
          remarks: data.remarks || data.notes || "Direct enrollment by admin",
        },
        include: {
          trainingProgram: { select: { id: true, code: true, title: true } },
          employee: { select: { id: true, name: true, employeeId: true } },
        },
      });
    }

    return prisma.trainingEnrollment.create({
      data: {
        trainingProgramId: data.trainingProgramId,
        employeeId: data.employeeId,
        status: data.status || EnrollmentStatus.APPROVED,
        appliedAt: new Date(),
        approvedAt: new Date(),
        remarks: data.remarks || data.notes || "Direct enrollment by admin",
      },
      include: {
        trainingProgram: { select: { id: true, code: true, title: true } },
        employee: { select: { id: true, name: true, employeeId: true } },
      },
    });
  },

  async updateEnrollment(enrollmentId: string, data: UpdateEnrollmentInput) {
    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new AppError(404, "Training Enrollment record not found", undefined, "ENROLLMENT_NOT_FOUND");
    }

    const updateData: Prisma.TrainingEnrollmentUpdateInput = {};
    if (data.status !== undefined) updateData.status = data.status;
    if (data.score !== undefined) updateData.score = data.score;
    if (data.certificateUrl !== undefined) updateData.certificateUrl = data.certificateUrl;
    if (data.certificateNo !== undefined) updateData.certificateNo = data.certificateNo;
    if (data.issueDate !== undefined) updateData.issueDate = new Date(data.issueDate);
    if (data.feedback !== undefined) updateData.feedback = data.feedback;
    if (data.remarks !== undefined) updateData.remarks = data.remarks;

    return prisma.trainingEnrollment.update({
      where: { id: enrollmentId },
      data: updateData,
      include: {
        trainingProgram: { select: { id: true, code: true, title: true } },
        employee: { select: { id: true, name: true, employeeId: true } },
      },
    });
  },

  async cancelEnrollment(enrollmentId: string) {
    const enrollment = await prisma.trainingEnrollment.findUnique({ where: { id: enrollmentId } });
    if (!enrollment) {
      throw new AppError(404, "Training Enrollment record not found", undefined, "ENROLLMENT_NOT_FOUND");
    }
    return prisma.trainingEnrollment.delete({ where: { id: enrollmentId } });
  },

  // --- QUERY APIS FOR EMPLOYEE & ADMIN ---
  async getAvailableTrainings(employeeId: string) {
    const openPrograms = await prisma.trainingProgram.findMany({
      where: {
        status: { in: [TrainingStatus.OPEN, TrainingStatus.UPCOMING] },
      },
      include: {
        _count: {
          select: {
            enrollments: {
              where: { status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.COMPLETED, EnrollmentStatus.ENROLLED] } },
            },
          },
        },
        enrollments: {
          where: { employeeId },
          select: { id: true, status: true, appliedAt: true, approvedAt: true },
        },
      },
      orderBy: { startDate: "asc" },
    });

    return openPrograms.map((prog) => {
      const userEnrollment = prog.enrollments[0] || null;
      return {
        id: prog.id,
        code: prog.code,
        title: prog.title,
        description: prog.description,
        category: prog.category,
        trainerName: prog.trainerName,
        location: prog.location,
        startDate: prog.startDate,
        endDate: prog.endDate,
        capacity: prog.capacity,
        status: prog.status,
        enrolledCount: prog._count.enrollments,
        isFull: prog._count.enrollments >= prog.capacity,
        materialsUrl:
          userEnrollment && (userEnrollment.status === EnrollmentStatus.APPROVED || userEnrollment.status === EnrollmentStatus.COMPLETED)
            ? prog.materialsUrl
            : null,
        myEnrollment: userEnrollment
          ? {
              id: userEnrollment.id,
              status: userEnrollment.status,
              appliedAt: userEnrollment.appliedAt,
            }
          : null,
      };
    });
  },

  async getEmployeeTrainings(employeeId: string) {
    const enrollments = await prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: {
        trainingProgram: true,
        approvedBy: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
    });

    return enrollments.map((enr) => ({
      ...enr,
      trainingProgram: {
        ...enr.trainingProgram,
        materialsUrl:
          enr.status === EnrollmentStatus.APPROVED || enr.status === EnrollmentStatus.COMPLETED ? enr.trainingProgram.materialsUrl : null,
      },
    }));
  },

  async getAdminEnrollments(query: { status?: EnrollmentStatus; trainingProgramId?: string; search?: string }) {
    const where: Prisma.TrainingEnrollmentWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.trainingProgramId) where.trainingProgramId = query.trainingProgramId;
    if (query.search) {
      where.OR = [
        { employee: { name: { contains: query.search } } },
        { employee: { employeeId: { contains: query.search } } },
        { trainingProgram: { title: { contains: query.search } } },
        { trainingProgram: { code: { contains: query.search } } },
      ];
    }

    return prisma.trainingEnrollment.findMany({
      where,
      include: {
        employee: { select: { id: true, name: true, employeeId: true, email: true, department: true } },
        trainingProgram: true,
        approvedBy: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getTrainingStats(role: string, userId: string) {
    if (role === "ADMIN") {
      const totalTrainings = await prisma.trainingProgram.count();
      const openTrainings = await prisma.trainingProgram.count({
        where: { status: { in: [TrainingStatus.OPEN, TrainingStatus.UPCOMING] } },
      });
      const pendingRequests = await prisma.trainingEnrollment.count({
        where: { status: EnrollmentStatus.PENDING },
      });
      const approvedParticipants = await prisma.trainingEnrollment.count({
        where: { status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ENROLLED] } },
      });
      const completedTrainings = await prisma.trainingEnrollment.count({
        where: { status: EnrollmentStatus.COMPLETED },
      });

      return {
        totalTrainings,
        openTrainings,
        pendingRequests,
        approvedParticipants,
        completedTrainings,
      };
    } else {
      const availableTrainings = await prisma.trainingProgram.count({
        where: { status: { in: [TrainingStatus.OPEN, TrainingStatus.UPCOMING] } },
      });
      const pendingRequests = await prisma.trainingEnrollment.count({
        where: { employeeId: userId, status: EnrollmentStatus.PENDING },
      });
      const approvedTrainings = await prisma.trainingEnrollment.count({
        where: { employeeId: userId, status: { in: [EnrollmentStatus.APPROVED, EnrollmentStatus.ENROLLED] } },
      });
      const completedTrainings = await prisma.trainingEnrollment.count({
        where: { employeeId: userId, status: EnrollmentStatus.COMPLETED },
      });

      return {
        availableTrainings,
        pendingRequests,
        approvedTrainings,
        completedTrainings,
      };
    }
  },

  // --- ANALYTICS ---
  async getTrainingAnalytics() {
    const totalPrograms = await prisma.trainingProgram.count();
    const activeSessions = await prisma.trainingProgram.count({
      where: { status: { in: [TrainingStatus.OPEN, TrainingStatus.UPCOMING, TrainingStatus.IN_PROGRESS] } },
    });
    const completedPrograms = await prisma.trainingProgram.count({
      where: { status: TrainingStatus.COMPLETED },
    });

    const totalEnrollments = await prisma.trainingEnrollment.count();
    const completedEnrollments = await prisma.trainingEnrollment.count({
      where: { status: EnrollmentStatus.COMPLETED },
    });
    const certificatesIssued = await prisma.trainingEnrollment.count({
      where: { certificateNo: { not: null } },
    });

    const completionRate = totalEnrollments ? Math.round((completedEnrollments / totalEnrollments) * 100) : 0;

    const categoriesRaw = await prisma.trainingProgram.groupBy({
      by: ["category"],
      _count: { _all: true },
    });

    const categoryBreakdown = categoriesRaw.map((c) => ({
      category: c.category || "General",
      count: c._count._all,
    }));

    return {
      totalPrograms,
      activeSessions,
      completedPrograms,
      totalEnrollments,
      completedEnrollments,
      certificatesIssued,
      completionRate,
      categoryBreakdown,
    };
  },
};
