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

  await prisma.user.upsert({
    where: { email: "admin@company.com" },
    update: {},
    create: {
      email: "admin@company.com",
      password: adminPassword,
      name: "System Admin",
      employeeId: "EMP001",
      department: "Administration",
      role: "ADMIN",
    },
  });
  console.log("Admin user created/verified (admin@company.com)");

  await prisma.user.upsert({
    where: { email: "john.doe@company.com" },
    update: {},
    create: {
      email: "john.doe@company.com",
      password: employeePassword,
      name: "John Doe",
      employeeId: "EMP002",
      department: "Engineering",
      role: "EMPLOYEE",
    },
  });

  await prisma.user.upsert({
    where: { email: "jane.smith@company.com" },
    update: {},
    create: {
      email: "jane.smith@company.com",
      password: employeePassword,
      name: "Jane Smith",
      employeeId: "EMP003",
      department: "Marketing",
      role: "EMPLOYEE",
    },
  });
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
