import prisma from "../config/database";
import { AppError } from "../utils/response";
import { PayrollStatus, Prisma } from "@prisma/client";
import {
  SalaryStructureInput,
  GeneratePayrollInput,
  GetPayrollRecordsQuery,
  UpdatePayrollRecordInput,
  BatchUpdateStatusInput,
  PayrollReportQuery,
  MonthlyPayrollSummaryResponse,
  DepartmentPayrollSummaryResponse,
  TotalPayrollCostResponse,
} from "../types/payroll.types";

const Decimal = Prisma.Decimal;

export const payrollService = {
  /**
   * Get all salary structures (with employee & position details)
   */
  async getSalaryStructures(query: { search?: string; departmentId?: string; page?: number; limit?: number }) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.UserWhereInput = {
      isActive: true,
      ...(query.departmentId ? { departmentId: query.departmentId } : {}),
      ...(query.search
        ? {
            OR: [
              { name: { contains: query.search } },
              { email: { contains: query.search } },
              { employeeId: { contains: query.search } },
            ],
          }
        : {}),
    };

    const [total, users] = await Promise.all([
      prisma.user.count({ where }),
      prisma.user.findMany({
        where,
        select: {
          id: true,
          name: true,
          email: true,
          employeeId: true,
          salary: true,
          departmentId: true,
          departmentRef: { select: { id: true, name: true, code: true } },
          position: { select: { id: true, title: true, code: true } },
          salaryStructure: true,
        },
        orderBy: { name: "asc" },
        skip,
        take: limit,
      }),
    ]);

    const data = users.map((user) => {
      const basicSalary = user.salaryStructure
        ? Number(user.salaryStructure.basicSalary)
        : user.salary
        ? Number(user.salary)
        : 0;
      const housingAllowance = user.salaryStructure ? Number(user.salaryStructure.housingAllowance) : 0;
      const transportAllowance = user.salaryStructure ? Number(user.salaryStructure.transportAllowance) : 0;
      const otherAllowance = user.salaryStructure ? Number(user.salaryStructure.otherAllowance) : 0;
      const bonus = user.salaryStructure ? Number(user.salaryStructure.bonus) : 0;
      const deduction = user.salaryStructure ? Number(user.salaryStructure.deduction) : 0;
      const totalAllowances = housingAllowance + transportAllowance + otherAllowance + bonus;
      const grossSalary = basicSalary + totalAllowances;
      const netSalary = grossSalary - deduction;

      return {
        user: {
          id: user.id,
          name: user.name,
          email: user.email,
          employeeId: user.employeeId,
          department: user.departmentRef,
          position: user.position,
        },
        salaryStructure: user.salaryStructure
          ? {
              id: user.salaryStructure.id,
              userId: user.salaryStructure.userId,
              basicSalary,
              housingAllowance,
              transportAllowance,
              otherAllowance,
              bonus,
              deduction,
              updatedAt: user.salaryStructure.updatedAt,
            }
          : {
              id: null,
              userId: user.id,
              basicSalary,
              housingAllowance: 0,
              transportAllowance: 0,
              otherAllowance: 0,
              bonus: 0,
              deduction: 0,
              updatedAt: null,
            },
        computed: {
          totalAllowances,
          grossSalary,
          totalDeductions: deduction,
          netSalary,
        },
      };
    });

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Upsert salary structure for a specific employee
   */
  async upsertSalaryStructure(input: SalaryStructureInput) {
    const user = await prisma.user.findUnique({
      where: { id: input.userId },
      select: { id: true, salary: true },
    });

    if (!user) {
      throw new AppError(404, "Employee not found", undefined, "USER_NOT_FOUND");
    }

    const basicSalary = input.basicSalary !== undefined ? input.basicSalary : user.salary ? Number(user.salary) : 0;
    const housingAllowance = input.housingAllowance ?? 0;
    const transportAllowance = input.transportAllowance ?? 0;
    const otherAllowance = input.otherAllowance ?? 0;
    const bonus = input.bonus ?? 0;
    const deduction = input.deduction ?? 0;

    const [structure] = await prisma.$transaction([
      prisma.salaryStructure.upsert({
        where: { userId: input.userId },
        create: {
          userId: input.userId,
          basicSalary: new Decimal(basicSalary),
          housingAllowance: new Decimal(housingAllowance),
          transportAllowance: new Decimal(transportAllowance),
          otherAllowance: new Decimal(otherAllowance),
          bonus: new Decimal(bonus),
          deduction: new Decimal(deduction),
        },
        update: {
          basicSalary: new Decimal(basicSalary),
          housingAllowance: new Decimal(housingAllowance),
          transportAllowance: new Decimal(transportAllowance),
          otherAllowance: new Decimal(otherAllowance),
          bonus: new Decimal(bonus),
          deduction: new Decimal(deduction),
        },
      }),
      // Keep basic salary in sync with user.salary
      prisma.user.update({
        where: { id: input.userId },
        data: { salary: new Decimal(basicSalary) },
      }),
    ]);

    return structure;
  },

  /**
   * Batch Generate Payroll for selected month and year
   * Prevents duplicate generation for already processed/paid records
   */
  async generatePayroll(input: GeneratePayrollInput) {
    const { month, year, departmentId, overwriteDrafts = false } = input;

    // Get all active employees matching filter
    const employees = await prisma.user.findMany({
      where: {
        isActive: true,
        ...(departmentId ? { departmentId } : {}),
      },
      select: {
        id: true,
        salary: true,
        salaryStructure: true,
      },
    });

    if (employees.length === 0) {
      throw new AppError(400, "No active employees found to generate payroll for.", undefined, "NO_EMPLOYEES");
    }

    let generatedCount = 0;
    let skippedCount = 0;
    let updatedDraftCount = 0;

    for (const emp of employees) {
      const existing = await prisma.payrollRecord.findUnique({
        where: {
          userId_month_year: {
            userId: emp.id,
            month,
            year,
          },
        },
      });

      if (existing) {
        if (existing.status === PayrollStatus.PROCESSED || existing.status === PayrollStatus.PAID) {
          // Locked record, skip duplicate generation
          skippedCount++;
          continue;
        }

        if (existing.status === PayrollStatus.DRAFT && !overwriteDrafts) {
          skippedCount++;
          continue;
        }
      }

      // Calculate figures
      const basicSalary = emp.salaryStructure
        ? Number(emp.salaryStructure.basicSalary)
        : emp.salary
        ? Number(emp.salary)
        : 0;
      const housingAllowance = emp.salaryStructure ? Number(emp.salaryStructure.housingAllowance) : 0;
      const transportAllowance = emp.salaryStructure ? Number(emp.salaryStructure.transportAllowance) : 0;
      const otherAllowance = emp.salaryStructure ? Number(emp.salaryStructure.otherAllowance) : 0;
      const bonus = emp.salaryStructure ? Number(emp.salaryStructure.bonus) : 0;
      const totalAllowances = housingAllowance + transportAllowance + otherAllowance + bonus;
      const deduction = emp.salaryStructure ? Number(emp.salaryStructure.deduction) : 0;
      const totalDeductions = deduction;
      const grossSalary = basicSalary + totalAllowances;
      const netSalary = grossSalary - totalDeductions;

      if (existing && existing.status === PayrollStatus.DRAFT && overwriteDrafts) {
        await prisma.payrollRecord.update({
          where: { id: existing.id },
          data: {
            basicSalary: new Decimal(basicSalary),
            housingAllowance: new Decimal(housingAllowance),
            transportAllowance: new Decimal(transportAllowance),
            otherAllowance: new Decimal(otherAllowance),
            bonus: new Decimal(bonus),
            totalAllowances: new Decimal(totalAllowances),
            deduction: new Decimal(deduction),
            totalDeductions: new Decimal(totalDeductions),
            grossSalary: new Decimal(grossSalary),
            netSalary: new Decimal(netSalary),
          },
        });
        updatedDraftCount++;
      } else {
        await prisma.payrollRecord.create({
          data: {
            userId: emp.id,
            month,
            year,
            basicSalary: new Decimal(basicSalary),
            housingAllowance: new Decimal(housingAllowance),
            transportAllowance: new Decimal(transportAllowance),
            otherAllowance: new Decimal(otherAllowance),
            bonus: new Decimal(bonus),
            totalAllowances: new Decimal(totalAllowances),
            deduction: new Decimal(deduction),
            totalDeductions: new Decimal(totalDeductions),
            grossSalary: new Decimal(grossSalary),
            netSalary: new Decimal(netSalary),
            status: PayrollStatus.DRAFT,
          },
        });
        generatedCount++;
      }
    }

    return {
      month,
      year,
      totalTargetEmployees: employees.length,
      generatedCount,
      updatedDraftCount,
      skippedCount,
      message: `Payroll generation completed for ${month}/${year}. (${generatedCount} created, ${updatedDraftCount} updated drafts, ${skippedCount} skipped/locked).`,
    };
  },

  /**
   * Get paginated payroll records for Admin Dashboard
   */
  async getPayrollRecords(query: GetPayrollRecordsQuery) {
    const page = Math.max(1, query.page || 1);
    const limit = Math.min(100, Math.max(1, query.limit || 10));
    const skip = (page - 1) * limit;

    const where: Prisma.PayrollRecordWhereInput = {
      ...(query.month ? { month: query.month } : {}),
      ...(query.year ? { year: query.year } : {}),
      ...(query.status ? { status: query.status } : {}),
      ...(query.userId ? { userId: query.userId } : {}),
      ...(query.departmentId ? { user: { departmentId: query.departmentId } } : {}),
      ...(query.search
        ? {
            user: {
              OR: [
                { name: { contains: query.search } },
                { email: { contains: query.search } },
                { employeeId: { contains: query.search } },
              ],
            },
          }
        : {}),
    };

    let orderBy: Prisma.PayrollRecordOrderByWithRelationInput = { createdAt: "desc" };
    if (query.sortBy === "month") orderBy = { month: query.sortOrder || "desc" };
    else if (query.sortBy === "netSalary") orderBy = { netSalary: query.sortOrder || "desc" };
    else if (query.sortBy === "status") orderBy = { status: query.sortOrder || "asc" };

    const [total, records, summaryAggregate] = await Promise.all([
      prisma.payrollRecord.count({ where }),
      prisma.payrollRecord.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
              employeeId: true,
              avatarUrl: true,
              departmentRef: { select: { id: true, name: true, code: true } },
              position: { select: { id: true, title: true, code: true } },
            },
          },
        },
        orderBy,
        skip,
        take: limit,
      }),
      prisma.payrollRecord.aggregate({
        where,
        _sum: {
          grossSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          netSalary: true,
        },
      }),
    ]);

    return {
      records,
      summary: {
        totalRecords: total,
        totalGrossSalary: Number(summaryAggregate._sum.grossSalary || 0),
        totalAllowances: Number(summaryAggregate._sum.totalAllowances || 0),
        totalDeductions: Number(summaryAggregate._sum.totalDeductions || 0),
        totalNetSalary: Number(summaryAggregate._sum.netSalary || 0),
      },
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  },

  /**
   * Get single payroll record detail / payslip
   */
  async getPayrollById(id: string) {
    const record = await prisma.payrollRecord.findUnique({
      where: { id },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            employeeId: true,
            phone: true,
            hireDate: true,
            avatarUrl: true,
            departmentRef: { select: { id: true, name: true, code: true } },
            position: { select: { id: true, title: true, code: true } },
          },
        },
      },
    });

    if (!record) {
      throw new AppError(404, "Payroll record not found", undefined, "NOT_FOUND");
    }

    return record;
  },

  /**
   * Update draft payroll record
   */
  async updatePayrollRecord(id: string, input: UpdatePayrollRecordInput) {
    const existing = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Payroll record not found", undefined, "NOT_FOUND");
    }

    if (existing.status === PayrollStatus.PAID && input.status !== PayrollStatus.PAID) {
      throw new AppError(400, "Cannot edit a paid payroll record", undefined, "LOCKED_RECORD");
    }

    const basicSalary = input.basicSalary !== undefined ? input.basicSalary : Number(existing.basicSalary);
    const housingAllowance = input.housingAllowance !== undefined ? input.housingAllowance : Number(existing.housingAllowance);
    const transportAllowance = input.transportAllowance !== undefined ? input.transportAllowance : Number(existing.transportAllowance);
    const otherAllowance = input.otherAllowance !== undefined ? input.otherAllowance : Number(existing.otherAllowance);
    const bonus = input.bonus !== undefined ? input.bonus : Number(existing.bonus);
    const deduction = input.deduction !== undefined ? input.deduction : Number(existing.deduction);

    const totalAllowances = housingAllowance + transportAllowance + otherAllowance + bonus;
    const totalDeductions = deduction;
    const grossSalary = basicSalary + totalAllowances;
    const netSalary = grossSalary - totalDeductions;

    const newStatus = input.status || existing.status;
    let processedAt = existing.processedAt;
    let paidAt = existing.paidAt;

    if (newStatus === PayrollStatus.PROCESSED && !processedAt) processedAt = new Date();
    if (newStatus === PayrollStatus.PAID) {
      if (!processedAt) processedAt = new Date();
      if (!paidAt) paidAt = new Date();
    }

    const updated = await prisma.payrollRecord.update({
      where: { id },
      data: {
        basicSalary: new Decimal(basicSalary),
        housingAllowance: new Decimal(housingAllowance),
        transportAllowance: new Decimal(transportAllowance),
        otherAllowance: new Decimal(otherAllowance),
        bonus: new Decimal(bonus),
        totalAllowances: new Decimal(totalAllowances),
        deduction: new Decimal(deduction),
        totalDeductions: new Decimal(totalDeductions),
        grossSalary: new Decimal(grossSalary),
        netSalary: new Decimal(netSalary),
        remarks: input.remarks !== undefined ? input.remarks : existing.remarks,
        status: newStatus,
        processedAt,
        paidAt,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            departmentRef: true,
            position: true,
          },
        },
      },
    });

    return updated;
  },

  /**
   * Batch update payroll status (e.g., Draft -> Processed, Processed -> Paid)
   */
  async batchUpdateStatus(input: BatchUpdateStatusInput) {
    const { payrollIds, status } = input;

    const now = new Date();
    const updateData: Prisma.PayrollRecordUpdateInput = {
      status,
      ...(status === PayrollStatus.PROCESSED ? { processedAt: now } : {}),
      ...(status === PayrollStatus.PAID ? { processedAt: now, paidAt: now } : {}),
    };

    const result = await prisma.payrollRecord.updateMany({
      where: {
        id: { in: payrollIds },
      },
      data: updateData,
    });

    return {
      updatedCount: result.count,
      status,
      message: `Successfully updated ${result.count} payroll records to ${status}`,
    };
  },

  /**
   * Delete a DRAFT payroll record
   */
  async deletePayrollRecord(id: string) {
    const existing = await prisma.payrollRecord.findUnique({ where: { id } });
    if (!existing) {
      throw new AppError(404, "Payroll record not found", undefined, "NOT_FOUND");
    }

    if (existing.status !== PayrollStatus.DRAFT) {
      throw new AppError(400, "Only DRAFT payroll records can be deleted", undefined, "CANNOT_DELETE_PROCESSED");
    }

    await prisma.payrollRecord.delete({ where: { id } });
    return { success: true, message: "Payroll record deleted successfully" };
  },

  /**
   * Employee self-service: get employee payslips
   */
  async getEmployeePayslips(userId: string, year?: number) {
    const where: Prisma.PayrollRecordWhereInput = {
      userId,
      status: { in: [PayrollStatus.PROCESSED, PayrollStatus.PAID] },
      ...(year ? { year } : {}),
    };

    const records = await prisma.payrollRecord.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            employeeId: true,
            departmentRef: { select: { name: true } },
            position: { select: { title: true } },
          },
        },
      },
      orderBy: [{ year: "desc" }, { month: "desc" }],
    });

    return records;
  },

  /**
   * Reports: Monthly Summary
   */
  async getMonthlySummaryReport(query: PayrollReportQuery): Promise<MonthlyPayrollSummaryResponse> {
    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;

    const where: Prisma.PayrollRecordWhereInput = {
      month,
      year,
      ...(query.departmentId ? { user: { departmentId: query.departmentId } } : {}),
    };

    const [statusCounts, aggregate] = await Promise.all([
      prisma.payrollRecord.groupBy({
        by: ["status"],
        where,
        _count: { id: true },
      }),
      prisma.payrollRecord.aggregate({
        where,
        _sum: {
          basicSalary: true,
          totalAllowances: true,
          totalDeductions: true,
          grossSalary: true,
          netSalary: true,
        },
        _count: { id: true },
      }),
    ]);

    let draftCount = 0;
    let processedCount = 0;
    let paidCount = 0;

    statusCounts.forEach((c) => {
      if (c.status === PayrollStatus.DRAFT) draftCount = c._count.id;
      if (c.status === PayrollStatus.PROCESSED) processedCount = c._count.id;
      if (c.status === PayrollStatus.PAID) paidCount = c._count.id;
    });

    return {
      month,
      year,
      totalEmployees: aggregate._count.id,
      draftCount,
      processedCount,
      paidCount,
      totalBasicSalary: Number(aggregate._sum.basicSalary || 0),
      totalAllowances: Number(aggregate._sum.totalAllowances || 0),
      totalDeductions: Number(aggregate._sum.totalDeductions || 0),
      totalGrossSalary: Number(aggregate._sum.grossSalary || 0),
      totalNetSalary: Number(aggregate._sum.netSalary || 0),
    };
  },

  /**
   * Reports: Department Summary
   */
  async getDepartmentSummaryReport(query: PayrollReportQuery): Promise<DepartmentPayrollSummaryResponse[]> {
    const year = query.year || new Date().getFullYear();
    const month = query.month || new Date().getMonth() + 1;

    const records = await prisma.payrollRecord.findMany({
      where: {
        month,
        year,
      },
      include: {
        user: {
          select: {
            departmentId: true,
            departmentRef: { select: { id: true, name: true, code: true } },
          },
        },
      },
    });

    const deptMap = new Map<string, DepartmentPayrollSummaryResponse>();

    records.forEach((rec) => {
      const deptId = rec.user.departmentId || "unassigned";
      const deptName = rec.user.departmentRef?.name || "Unassigned";
      const deptCode = rec.user.departmentRef?.code || "N/A";

      const existing = deptMap.get(deptId) || {
        departmentId: rec.user.departmentId,
        departmentName: deptName,
        departmentCode: deptCode,
        employeeCount: 0,
        totalBasicSalary: 0,
        totalAllowances: 0,
        totalDeductions: 0,
        totalGrossSalary: 0,
        totalNetSalary: 0,
      };

      existing.employeeCount += 1;
      existing.totalBasicSalary += Number(rec.basicSalary);
      existing.totalAllowances += Number(rec.totalAllowances);
      existing.totalDeductions += Number(rec.totalDeductions);
      existing.totalGrossSalary += Number(rec.grossSalary);
      existing.totalNetSalary += Number(rec.netSalary);

      deptMap.set(deptId, existing);
    });

    return Array.from(deptMap.values()).sort((a, b) => b.totalGrossSalary - a.totalGrossSalary);
  },

  /**
   * Reports: Total Payroll Cost Analysis
   */
  async getTotalPayrollCostReport(query: PayrollReportQuery): Promise<TotalPayrollCostResponse> {
    const year = query.year || new Date().getFullYear();

    const records = await prisma.payrollRecord.findMany({
      where: {
        year,
        ...(query.departmentId ? { user: { departmentId: query.departmentId } } : {}),
      },
    });

    const monthlyBreakdown = Array.from({ length: 12 }, (_, i) => ({
      month: i + 1,
      employeeCount: 0,
      grossSalary: 0,
      netSalary: 0,
      totalAllowances: 0,
      totalDeductions: 0,
    }));

    let annualTotalGross = 0;
    let annualTotalNet = 0;
    let annualTotalAllowances = 0;
    let annualTotalDeductions = 0;

    records.forEach((rec) => {
      const mIdx = rec.month - 1;
      if (mIdx >= 0 && mIdx < 12) {
        monthlyBreakdown[mIdx].employeeCount += 1;
        monthlyBreakdown[mIdx].grossSalary += Number(rec.grossSalary);
        monthlyBreakdown[mIdx].netSalary += Number(rec.netSalary);
        monthlyBreakdown[mIdx].totalAllowances += Number(rec.totalAllowances);
        monthlyBreakdown[mIdx].totalDeductions += Number(rec.totalDeductions);

        annualTotalGross += Number(rec.grossSalary);
        annualTotalNet += Number(rec.netSalary);
        annualTotalAllowances += Number(rec.totalAllowances);
        annualTotalDeductions += Number(rec.totalDeductions);
      }
    });

    return {
      year,
      annualTotalGross,
      annualTotalNet,
      annualTotalAllowances,
      annualTotalDeductions,
      monthlyBreakdown,
    };
  },
};
