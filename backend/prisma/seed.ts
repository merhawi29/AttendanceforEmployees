import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const adminPassword = await bcrypt.hash(
    process.env.SEED_ADMIN_PASSWORD || "admin123",
    12
  );
  const employeePassword = await bcrypt.hash(
    process.env.SEED_EMPLOYEE_PASSWORD || "employee123",
    12
  );

  const adminUser = await prisma.user.findFirst({
    where: { OR: [{ email: "admin@company.com" }, { employeeId: "EMP001" }] },
  });
  if (!adminUser) {
    await prisma.user.create({
      data: {
        email: "admin@company.com",
        password: adminPassword,
        name: "System Admin",
        employeeId: "EMP001",
        department: "Administration",
        role: "ADMIN",
      },
    });
  }
  console.log("Admin user created/verified (admin@company.com)");

  const emp1 = await prisma.user.findFirst({
    where: { OR: [{ email: "john.doe@company.com" }, { employeeId: "EMP002" }] },
  });
  if (!emp1) {
    await prisma.user.create({
      data: {
        email: "john.doe@company.com",
        password: employeePassword,
        name: "John Doe",
        employeeId: "EMP002",
        department: "Engineering",
        role: "EMPLOYEE",
      },
    });
  }

  const emp2 = await prisma.user.findFirst({
    where: { OR: [{ email: "jane.smith@company.com" }, { employeeId: "EMP003" }] },
  });
  if (!emp2) {
    await prisma.user.create({
      data: {
        email: "jane.smith@company.com",
        password: employeePassword,
        name: "Jane Smith",
        employeeId: "EMP003",
        department: "Marketing",
        role: "EMPLOYEE",
      },
    });
  }
  console.log("Employee users created/verified");

  const ips = process.env.SEED_ALLOWED_IPS
    ? process.env.SEED_ALLOWED_IPS.split(",").map((s) => s.trim())
    : ["127.0.0.1", "::1", "localhost"];

  for (const ip of ips) {
    await prisma.allowedIp.upsert({
      where: { ipAddress: ip },
      update: { isActive: true },
      create: { ipAddress: ip, description: "Initial seed" },
    });
  }
  console.log(`Allowed IPs whitelisted: ${ips.join(", ")}`);

  // Seed default Leave Types
  const leaveTypes = [
    { code: "ANNUAL", name: "Annual Leave", description: "Paid annual vacation leave", defaultDaysPerYear: 20, isPaid: true, requiresApproval: true },
    { code: "SICK", name: "Sick Leave", description: "Paid medical and health leave", defaultDaysPerYear: 15, isPaid: true, requiresApproval: true },
    { code: "UNPAID", name: "Unpaid Leave", description: "Authorized unpaid absence", defaultDaysPerYear: 30, isPaid: false, requiresApproval: true },
    { code: "MATERNITY", name: "Maternity Leave", description: "Maternity leave for mothers", defaultDaysPerYear: 120, isPaid: true, requiresApproval: true },
    { code: "PATERNITY", name: "Paternity Leave", description: "Paternity leave for fathers", defaultDaysPerYear: 10, isPaid: true, requiresApproval: true },
  ];

  for (const lt of leaveTypes) {
    await prisma.leaveType.upsert({
      where: { code: lt.code },
      update: {},
      create: lt,
    });
  }
  console.log("Default Leave Types seeded");

  console.log("Seed completed successfully");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
