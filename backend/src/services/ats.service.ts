import prisma from "../config/database";
import { JobStatus, ApplicationStatus, InterviewType, InterviewStatus, Prisma } from "@prisma/client";
import { AppError } from "../utils/response";
import bcrypt from "bcryptjs";

export interface CreateJobInput {
  code: string;
  title: string;
  department?: string;
  location?: string;
  employmentType?: string;
  description: string;
  requirements?: string;
  minSalary?: number;
  maxSalary?: number;
  status?: JobStatus;
  closingDate?: string;
}

export interface CreateApplicationInput {
  jobPostingId: string;
  applicantName: string;
  email: string;
  phone?: string;
  resumeUrl?: string;
  coverLetter?: string;
  experienceYears?: number;
  currentCompany?: string;
  notes?: string;
}

export interface ScheduleInterviewInput {
  jobApplicationId: string;
  interviewerId: string;
  interviewType?: InterviewType;
  scheduledAt: string;
  location?: string;
}

export const atsService = {
  // --- JOB POSTINGS ---
  async createJob(data: CreateJobInput) {
    const existingCode = await prisma.jobPosting.findUnique({ where: { code: data.code } });
    if (existingCode) {
      throw new AppError(409, "Job posting code already exists", undefined, "DUPLICATE_CODE");
    }

    return prisma.jobPosting.create({
      data: {
        code: data.code,
        title: data.title,
        department: data.department || null,
        location: data.location || null,
        employmentType: data.employmentType || "FULL_TIME",
        description: data.description,
        requirements: data.requirements || null,
        minSalary: data.minSalary !== undefined ? new Prisma.Decimal(data.minSalary) : null,
        maxSalary: data.maxSalary !== undefined ? new Prisma.Decimal(data.maxSalary) : null,
        status: data.status || JobStatus.OPEN,
        closingDate: data.closingDate ? new Date(data.closingDate) : null,
      },
      include: {
        _count: { select: { applications: true } },
      },
    });
  },

  async updateJob(jobId: string, data: Partial<CreateJobInput>) {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new AppError(404, "Job posting not found", undefined, "JOB_NOT_FOUND");
    }

    const updateData: Prisma.JobPostingUpdateInput = {};
    if (data.code !== undefined) updateData.code = data.code;
    if (data.title !== undefined) updateData.title = data.title;
    if (data.department !== undefined) updateData.department = data.department;
    if (data.location !== undefined) updateData.location = data.location;
    if (data.employmentType !== undefined) updateData.employmentType = data.employmentType;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.requirements !== undefined) updateData.requirements = data.requirements;
    if (data.minSalary !== undefined) updateData.minSalary = new Prisma.Decimal(data.minSalary);
    if (data.maxSalary !== undefined) updateData.maxSalary = new Prisma.Decimal(data.maxSalary);
    if (data.status !== undefined) updateData.status = data.status;
    if (data.closingDate !== undefined) updateData.closingDate = new Date(data.closingDate);

    return prisma.jobPosting.update({
      where: { id: jobId },
      data: updateData,
      include: {
        _count: { select: { applications: true } },
      },
    });
  },

  async deleteJob(jobId: string) {
    const job = await prisma.jobPosting.findUnique({ where: { id: jobId } });
    if (!job) {
      throw new AppError(404, "Job posting not found", undefined, "JOB_NOT_FOUND");
    }
    return prisma.jobPosting.delete({ where: { id: jobId } });
  },

  async getJobs(query: { status?: JobStatus; department?: string; search?: string }) {
    const where: Prisma.JobPostingWhereInput = {};
    if (query.status) where.status = query.status;
    if (query.department) where.department = query.department;
    if (query.search) {
      where.OR = [
        { title: { contains: query.search } },
        { code: { contains: query.search } },
        { department: { contains: query.search } },
      ];
    }

    return prisma.jobPosting.findMany({
      where,
      include: {
        _count: { select: { applications: true } },
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async getJobById(jobId: string) {
    const job = await prisma.jobPosting.findUnique({
      where: { id: jobId },
      include: {
        applications: {
          include: { interviews: true },
          orderBy: { appliedDate: "desc" },
        },
        _count: { select: { applications: true } },
      },
    });
    if (!job) {
      throw new AppError(404, "Job posting not found", undefined, "JOB_NOT_FOUND");
    }
    return job;
  },

  // --- JOB APPLICATIONS & CANDIDATE PIPELINE ---
  async createApplication(data: CreateApplicationInput) {
    const job = await prisma.jobPosting.findUnique({ where: { id: data.jobPostingId } });
    if (!job) {
      throw new AppError(404, "Job posting not found", undefined, "JOB_NOT_FOUND");
    }

    return prisma.jobApplication.create({
      data: {
        jobPostingId: data.jobPostingId,
        applicantName: data.applicantName,
        email: data.email.toLowerCase().trim(),
        phone: data.phone || null,
        resumeUrl: data.resumeUrl || null,
        coverLetter: data.coverLetter || null,
        experienceYears: data.experienceYears !== undefined ? data.experienceYears : null,
        currentCompany: data.currentCompany || null,
        notes: data.notes || null,
        status: ApplicationStatus.APPLIED,
      },
      include: {
        jobPosting: { select: { id: true, code: true, title: true, department: true } },
      },
    });
  },

  async updateApplicationStatus(applicationId: string, status: ApplicationStatus, notes?: string) {
    const app = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!app) {
      throw new AppError(404, "Job application not found", undefined, "APPLICATION_NOT_FOUND");
    }

    const updateData: Prisma.JobApplicationUpdateInput = { status };
    if (notes !== undefined) {
      updateData.notes = notes;
    }

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        jobPosting: { select: { id: true, code: true, title: true, department: true } },
        interviews: true,
      },
    });
  },

  async rateApplication(applicationId: string, rating: number, notes?: string) {
    const app = await prisma.jobApplication.findUnique({ where: { id: applicationId } });
    if (!app) {
      throw new AppError(404, "Job application not found", undefined, "APPLICATION_NOT_FOUND");
    }

    const updateData: Prisma.JobApplicationUpdateInput = { rating };
    if (notes) updateData.notes = notes;

    return prisma.jobApplication.update({
      where: { id: applicationId },
      data: updateData,
      include: {
        jobPosting: { select: { id: true, code: true, title: true, department: true } },
      },
    });
  },

  async getApplications(query: { jobPostingId?: string; status?: ApplicationStatus; search?: string }) {
    const where: Prisma.JobApplicationWhereInput = {};
    if (query.jobPostingId) where.jobPostingId = query.jobPostingId;
    if (query.status) where.status = query.status;
    if (query.search) {
      where.OR = [
        { applicantName: { contains: query.search } },
        { email: { contains: query.search } },
        { currentCompany: { contains: query.search } },
      ];
    }

    return prisma.jobApplication.findMany({
      where,
      include: {
        jobPosting: { select: { id: true, code: true, title: true, department: true } },
        interviews: {
          include: { interviewer: { select: { id: true, name: true } } },
        },
      },
      orderBy: { appliedDate: "desc" },
    });
  },

  async convertHiredToEmployee(applicationId: string, employeeIdCode: string, department?: string, role = "EMPLOYEE", rawPassword = "employee123") {
    const app = await prisma.jobApplication.findUnique({
      where: { id: applicationId },
      include: { jobPosting: true },
    });

    if (!app) {
      throw new AppError(404, "Job application not found", undefined, "APPLICATION_NOT_FOUND");
    }

    const existingUser = await prisma.user.findFirst({
      where: { OR: [{ email: app.email }, { employeeId: employeeIdCode }] },
    });

    if (existingUser) {
      throw new AppError(409, "User with this email or employee code already exists", undefined, "DUPLICATE_USER");
    }

    const hashedPassword = await bcrypt.hash(rawPassword, 12);
    const targetDept = department || app.jobPosting?.department || "Engineering";

    const newUser = await prisma.user.create({
      data: {
        email: app.email,
        name: app.applicantName,
        employeeId: employeeIdCode,
        password: hashedPassword,
        department: targetDept,
        role: role as any,
        isActive: true,
      },
    });

    await prisma.jobApplication.update({
      where: { id: applicationId },
      data: { status: ApplicationStatus.HIRED, notes: `Converted to Employee ID: ${employeeIdCode}` },
    });

    return newUser;
  },

  // --- INTERVIEW SCHEDULING ---
  async scheduleInterview(data: ScheduleInterviewInput) {
    const app = await prisma.jobApplication.findUnique({ where: { id: data.jobApplicationId } });
    if (!app) {
      throw new AppError(404, "Job application not found", undefined, "APPLICATION_NOT_FOUND");
    }

    const interviewer = await prisma.user.findUnique({ where: { id: data.interviewerId } });
    if (!interviewer) {
      throw new AppError(404, "Interviewer user not found", undefined, "USER_NOT_FOUND");
    }

    const interview = await prisma.interview.create({
      data: {
        jobApplicationId: data.jobApplicationId,
        interviewerId: data.interviewerId,
        interviewType: data.interviewType || InterviewType.TECHNICAL,
        scheduledAt: new Date(data.scheduledAt),
        location: data.location || null,
        status: InterviewStatus.SCHEDULED,
      },
      include: {
        jobApplication: {
          select: { id: true, applicantName: true, email: true, jobPosting: { select: { title: true } } },
        },
        interviewer: { select: { id: true, name: true, email: true } },
      },
    });

    // Auto update application status to INTERVIEW_SCHEDULED if currently APPLIED or SCREENED
    if (app.status === ApplicationStatus.APPLIED || app.status === ApplicationStatus.SCREENED) {
      await prisma.jobApplication.update({
        where: { id: data.jobApplicationId },
        data: { status: ApplicationStatus.INTERVIEW_SCHEDULED },
      });
    }

    return interview;
  },

  async submitInterviewFeedback(interviewId: string, feedback: string, score: number, status: InterviewStatus = InterviewStatus.COMPLETED) {
    const interview = await prisma.interview.findUnique({ where: { id: interviewId } });
    if (!interview) {
      throw new AppError(404, "Interview record not found", undefined, "INTERVIEW_NOT_FOUND");
    }

    return prisma.interview.update({
      where: { id: interviewId },
      data: { feedback, score, status },
      include: {
        jobApplication: { select: { id: true, applicantName: true, jobPosting: { select: { title: true } } } },
        interviewer: { select: { id: true, name: true } },
      },
    });
  },

  async getInterviews(query: { jobApplicationId?: string; status?: InterviewStatus }) {
    const where: Prisma.InterviewWhereInput = {};
    if (query.jobApplicationId) where.jobApplicationId = query.jobApplicationId;
    if (query.status) where.status = query.status;

    return prisma.interview.findMany({
      where,
      include: {
        jobApplication: {
          include: { jobPosting: { select: { id: true, title: true, code: true } } },
        },
        interviewer: { select: { id: true, name: true, email: true } },
      },
      orderBy: { scheduledAt: "asc" },
    });
  },

  // --- RECRUITMENT ANALYTICS ---
  async getAtsAnalytics() {
    const totalJobs = await prisma.jobPosting.count();
    const openJobs = await prisma.jobPosting.count({ where: { status: JobStatus.OPEN } });
    const totalApplications = await prisma.jobApplication.count();
    const hiredCount = await prisma.jobApplication.count({ where: { status: ApplicationStatus.HIRED } });
    const scheduledInterviews = await prisma.interview.count({ where: { status: InterviewStatus.SCHEDULED } });

    const stageDistribution: Record<ApplicationStatus, number> = {
      APPLIED: 0,
      SCREENED: 0,
      INTERVIEW_SCHEDULED: 0,
      OFFER_EXTENDED: 0,
      HIRED: 0,
      REJECTED: 0,
    };

    const apps = await prisma.jobApplication.findMany({ select: { status: true } });
    apps.forEach((a) => {
      if (stageDistribution[a.status] !== undefined) {
        stageDistribution[a.status]++;
      }
    });

    const conversionRate = totalApplications ? Math.round((hiredCount / totalApplications) * 100) : 0;

    const recentApplications = await prisma.jobApplication.findMany({
      take: 5,
      include: {
        jobPosting: { select: { title: true, code: true } },
      },
      orderBy: { appliedDate: "desc" },
    });

    return {
      totalJobs,
      openJobs,
      totalApplications,
      hiredCount,
      scheduledInterviews,
      conversionRate,
      stageDistribution,
      recentApplications,
    };
  },
};
