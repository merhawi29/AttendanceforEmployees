import prisma from "../config/database";
import { TrainingStatus, EnrollmentStatus, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";

export interface CreateProgramInput {
  code: string;
  title: string;
  description: string;
  category?: string;
  trainerName?: string;
  location?: string;
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
}

export interface UpdateEnrollmentInput {
  status?: EnrollmentStatus;
  score?: number;
  certificateUrl?: string;
  certificateNo?: string;
  issueDate?: string;
  feedback?: string;
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
        startDate: new Date(data.startDate),
        endDate: new Date(data.endDate),
        capacity: data.capacity || 20,
        status: data.status || TrainingStatus.UPCOMING,
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

  // --- ENROLLMENTS ---
  async enrollEmployee(data: EnrollEmployeeInput) {
    const program = await prisma.trainingProgram.findUnique({
      where: { id: data.trainingProgramId },
      include: { _count: { select: { enrollments: true } } },
    });
    if (!program) {
      throw new AppError(404, "Training Program not found", undefined, "PROGRAM_NOT_FOUND");
    }

    if (program._count.enrollments >= program.capacity) {
      throw new AppError(400, "Training Program has reached maximum capacity", undefined, "PROGRAM_FULL");
    }

    const employee = await prisma.user.findUnique({ where: { id: data.employeeId } });
    if (!employee) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const existing = await prisma.trainingEnrollment.findFirst({
      where: { trainingProgramId: data.trainingProgramId, employeeId: data.employeeId },
    });
    if (existing) {
      throw new AppError(409, "Employee is already enrolled in this training program", undefined, "DUPLICATE_ENROLLMENT");
    }

    return prisma.trainingEnrollment.create({
      data: {
        trainingProgramId: data.trainingProgramId,
        employeeId: data.employeeId,
        status: data.status || EnrollmentStatus.ENROLLED,
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

  async getEmployeeTrainings(employeeId: string) {
    return prisma.trainingEnrollment.findMany({
      where: { employeeId },
      include: {
        trainingProgram: true,
      },
      orderBy: { enrolledDate: "desc" },
    });
  },

  // --- ANALYTICS ---
  async getTrainingAnalytics() {
    const totalPrograms = await prisma.trainingProgram.count();
    const activeSessions = await prisma.trainingProgram.count({
      where: { status: { in: [TrainingStatus.UPCOMING, TrainingStatus.IN_PROGRESS] } },
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
