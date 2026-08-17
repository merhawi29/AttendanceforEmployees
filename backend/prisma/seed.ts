import { PrismaClient, Prisma } from "@prisma/client";
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
  } else {
    await prisma.user.update({
      where: { id: adminUser.id },
      data: { password: adminPassword },
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
  } else {
    await prisma.user.update({
      where: { id: emp1.id },
      data: { password: employeePassword },
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

  // Seed sample Performance Goals and Reviews if users exist
  const adminUserRecord = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  const employees = await prisma.user.findMany({ where: { role: "EMPLOYEE" } });

  if (adminUserRecord && employees.length > 0) {
    for (let i = 0; i < employees.length; i++) {
      const emp = employees[i];
      
      // Seed goal
      const existingGoal = await prisma.performanceGoal.findFirst({
        where: { employeeId: emp.id, title: { contains: "Q3 Performance Goal" } },
      });
      if (!existingGoal) {
        await prisma.performanceGoal.create({
          data: {
            employeeId: emp.id,
            title: `Q3 Performance Goal - ${emp.name}`,
            description: "Deliver key feature modules on schedule with high test coverage and minimal bug backlog.",
            targetDate: new Date(Date.now() + 30 * 86400000),
            progressPercentage: (i + 1) * 25,
            status: (i + 1) * 25 === 100 ? "COMPLETED" : "IN_PROGRESS",
          },
        });
      }

      // Seed review
      const existingReview = await prisma.performanceReview.findFirst({
        where: { employeeId: emp.id },
      });
      if (!existingReview) {
        const score = 85 + (i * 4);
        const rating = score >= 90 ? "OUTSTANDING" : score >= 80 ? "VERY_GOOD" : "GOOD";
        await prisma.performanceReview.create({
          data: {
            employeeId: emp.id,
            reviewerId: adminUserRecord.id,
            reviewDate: new Date(),
            overallScore: score,
            rating: rating as any,
            strengths: "Exceptional code quality, strong teamwork, dependable project delivery.",
            weaknesses: "Can improve documentation and cross-team communication timing.",
            comments: "Consistently exceeds expectations across core performance benchmarks.",
            recommendation: score >= 90 ? "PROMOTION & SALARY_INCREMENT" : "RETENTION & REGULAR_INCREMENT",
          },
        });
      }
    }
    console.log("Sample Performance Goals & Reviews seeded");
  }

  // Seed sample ATS Job Postings, Applications, and Interviews
  const existingJob = await prisma.jobPosting.findUnique({ where: { code: "JOB-2026-001" } });
  if (!existingJob) {
    const job1 = await prisma.jobPosting.create({
      data: {
        code: "JOB-2026-001",
        title: "Senior Full-Stack Engineer",
        department: "Engineering",
        location: "Addis Ababa (Hybrid)",
        employmentType: "FULL_TIME",
        description: "Looking for an experienced Full-Stack Engineer with proficiency in React, Node.js, Express, and MySQL.",
        requirements: "5+ years of experience with TypeScript, REST APIs, microservices, and database optimization.",
        minSalary: new Prisma.Decimal(45000),
        maxSalary: new Prisma.Decimal(65000),
        status: "OPEN",
        closingDate: new Date(Date.now() + 60 * 86400000),
      },
    });

    const job2 = await prisma.jobPosting.create({
      data: {
        code: "JOB-2026-002",
        title: "HR & Recruitment Operations Specialist",
        department: "Human Resources",
        location: "Addis Ababa (Onsite)",
        employmentType: "FULL_TIME",
        description: "Responsible for talent acquisition, candidate screening, interview coordination, and onboarding.",
        requirements: "3+ years in HR management or agency recruiting with strong communication skills.",
        minSalary: new Prisma.Decimal(30000),
        maxSalary: new Prisma.Decimal(42000),
        status: "OPEN",
        closingDate: new Date(Date.now() + 45 * 86400000),
      },
    });

    const app1 = await prisma.jobApplication.create({
      data: {
        jobPostingId: job1.id,
        applicantName: "Abebe Bikila",
        email: "abebe.bikila@example.com",
        phone: "+251 911 223344",
        experienceYears: 6,
        currentCompany: "TechEthio Solutions",
        status: "INTERVIEW_SCHEDULED",
        rating: 5,
        notes: "Strong candidate with deep TypeScript expertise.",
      },
    });

    await prisma.jobApplication.create({
      data: {
        jobPostingId: job1.id,
        applicantName: "Tigist Assefa",
        email: "tigist.assefa@example.com",
        phone: "+251 922 334455",
        experienceYears: 4,
        currentCompany: "FinTech Horn",
        status: "SCREENED",
        rating: 4,
        notes: "Solid background in React and frontend architecture.",
      },
    });

    await prisma.jobApplication.create({
      data: {
        jobPostingId: job2.id,
        applicantName: "Haile Gebrselassie",
        email: "haile.geb@example.com",
        phone: "+251 933 445566",
        experienceYears: 5,
        currentCompany: "Global HR Services",
        status: "APPLIED",
        rating: 3,
      },
    });

    if (adminUserRecord) {
      await prisma.interview.create({
        data: {
          jobApplicationId: app1.id,
          interviewerId: adminUserRecord.id,
          interviewType: "TECHNICAL",
          scheduledAt: new Date(Date.now() + 2 * 86400000),
          location: "Google Meet - https://meet.google.com/abc-defg-hij",
          status: "SCHEDULED",
        },
      });
    }

    console.log("Sample ATS Job Postings, Applications & Interviews seeded");
  }

  // Seed sample Asset Categories, Assets, and Employee Assignments
  const existingCat = await prisma.assetCategory.findUnique({ where: { code: "CAT-LAPTOP" } });
  if (!existingCat) {
    const catLaptop = await prisma.assetCategory.create({
      data: { code: "CAT-LAPTOP", name: "Laptops & Computers", description: "Company issued laptops, MacBooks, and desktop workstations." },
    });
    const catPhone = await prisma.assetCategory.create({
      data: { code: "CAT-PHONE", name: "Phones & Mobile Devices", description: "Mobile phones, smartphones, tablets, and corporate SIM cards." },
    });
    const catID = await prisma.assetCategory.create({
      data: { code: "CAT-ID", name: "ID Cards & Access Badges", description: "Employee RFID ID badges, security keys, and building passes." },
    });
    const catMonitor = await prisma.assetCategory.create({
      data: { code: "CAT-MONITOR", name: "Monitors & Displays", description: "External desktop monitors, dual screen displays, and docks." },
    });

    const empFirst = await prisma.user.findFirst({ where: { role: "EMPLOYEE" } });

    // Seed MacBook Pro
    const laptop1 = await prisma.asset.create({
      data: {
        assetTag: "AST-LAP-001",
        name: "Apple MacBook Pro 16-inch M2",
        categoryId: catLaptop.id,
        brand: "Apple",
        model: "MacBook Pro M2 Max",
        serialNumber: "C02G1234MBP16",
        purchaseDate: new Date("2026-01-15"),
        purchaseCost: new Prisma.Decimal(115000),
        status: empFirst ? "ASSIGNED" : "AVAILABLE",
        condition: "EXCELLENT",
        assignedToId: empFirst ? empFirst.id : null,
        assignedDate: empFirst ? new Date("2026-01-20") : null,
        notes: "Primary development machine",
      },
    });

    // Seed Dell Laptop
    await prisma.asset.create({
      data: {
        assetTag: "AST-LAP-002",
        name: "Dell Latitude 5430 i7 16GB",
        categoryId: catLaptop.id,
        brand: "Dell",
        model: "Latitude 5430",
        serialNumber: "SN-DELL-5430-891",
        purchaseDate: new Date("2026-02-10"),
        purchaseCost: new Prisma.Decimal(58000),
        status: "AVAILABLE",
        condition: "NEW",
      },
    });

    // Seed iPhone
    await prisma.asset.create({
      data: {
        assetTag: "AST-PHN-001",
        name: "iPhone 14 Pro 256GB Space Black",
        categoryId: catPhone.id,
        brand: "Apple",
        model: "iPhone 14 Pro",
        serialNumber: "F2LX7890PHN",
        purchaseDate: new Date("2026-03-01"),
        purchaseCost: new Prisma.Decimal(62000),
        status: empFirst ? "ASSIGNED" : "AVAILABLE",
        condition: "EXCELLENT",
        assignedToId: empFirst ? empFirst.id : null,
        assignedDate: empFirst ? new Date("2026-03-05") : null,
      },
    });

    // Seed Monitor
    await prisma.asset.create({
      data: {
        assetTag: "AST-MON-001",
        name: "Samsung 27-inch 4K UHD Monitor",
        categoryId: catMonitor.id,
        brand: "Samsung",
        model: "ViewFinity S8 27\"",
        serialNumber: "SAM-27UHD-4K-001",
        purchaseDate: new Date("2026-02-15"),
        purchaseCost: new Prisma.Decimal(18500),
        status: empFirst ? "ASSIGNED" : "AVAILABLE",
        condition: "EXCELLENT",
        assignedToId: empFirst ? empFirst.id : null,
        assignedDate: empFirst ? new Date("2026-02-20") : null,
      },
    });

    // Seed Staff ID Badge
    await prisma.asset.create({
      data: {
        assetTag: "AST-IDC-001",
        name: "Corporate RFID Access Badge #1042",
        categoryId: catID.id,
        brand: "HID Global",
        model: "iCLASS Seos RFID Card",
        serialNumber: "RFID-BADGE-1042",
        purchaseDate: new Date("2026-01-01"),
        purchaseCost: new Prisma.Decimal(450),
        status: empFirst ? "ASSIGNED" : "AVAILABLE",
        condition: "EXCELLENT",
        assignedToId: empFirst ? empFirst.id : null,
        assignedDate: empFirst ? new Date("2026-01-05") : null,
      },
    });

    if (empFirst && adminUserRecord) {
      await prisma.assetAssignment.create({
        data: {
          assetId: laptop1.id,
          employeeId: empFirst.id,
          assignedById: adminUserRecord.id,
          assignedDate: new Date("2026-01-20"),
          conditionOnAssign: "EXCELLENT",
          status: "ACTIVE",
          notes: "Initial issuance during employee onboarding",
        },
      });
    }

    console.log("Sample Asset Categories, Laptops, Phones, ID Cards, Monitors & Assignments seeded");
  }

  // Seed sample Training Programs and Enrollments
  const existingTrn = await prisma.trainingProgram.findUnique({ where: { code: "TRN-DEV-001" } });
  if (!existingTrn) {
    const trn1 = await prisma.trainingProgram.create({
      data: {
        code: "TRN-DEV-001",
        title: "Advanced TypeScript & Full-Stack Node.js Architecture",
        description: "Deep dive into clean architecture, microservices, async patterns, and Prisma ORM optimization.",
        category: "Technical",
        trainerName: "Dr. Samuel Tadesse",
        location: "Training Lab B / Zoom Hybrid",
        startDate: new Date("2026-09-01"),
        endDate: new Date("2026-09-15"),
        capacity: 25,
        status: "UPCOMING",
      },
    });

    const trn2 = await prisma.trainingProgram.create({
      data: {
        code: "TRN-LDR-002",
        title: "Executive Leadership & People Management Workshop",
        description: "Essential manager competencies, conflict resolution, KPIs, and performance appraisal coaching.",
        category: "Leadership",
        trainerName: "Bethlehem Alemu",
        location: "Executive Boardroom 3",
        startDate: new Date("2026-07-10"),
        endDate: new Date("2026-07-12"),
        capacity: 15,
        status: "COMPLETED",
      },
    });

    const trn3 = await prisma.trainingProgram.create({
      data: {
        code: "TRN-SEC-003",
        title: "Cyber Security Compliance & Data Protection Policy 2026",
        description: "Mandatory security awareness training covering phishing, credentials, and GDPR/data privacy laws.",
        category: "Compliance",
        trainerName: "Dawit Worku (CISO)",
        location: "Auditorium & LMS Platform",
        startDate: new Date("2026-08-01"),
        endDate: new Date("2026-08-05"),
        capacity: 100,
        status: "IN_PROGRESS",
      },
    });

    const empFirst = await prisma.user.findFirst({ where: { role: "EMPLOYEE" } });
    if (empFirst) {
      // Completed enrollment with certificate
      await prisma.trainingEnrollment.create({
        data: {
          trainingProgramId: trn2.id,
          employeeId: empFirst.id,
          enrolledDate: new Date("2026-07-01"),
          status: "COMPLETED",
          score: 94.5,
          certificateNo: "CERT-2026-LDR-089",
          issueDate: new Date("2026-07-12"),
          feedback: "Outstanding course! Excellent practical management tools.",
        },
      });

      // Active enrollment in progress
      await prisma.trainingEnrollment.create({
        data: {
          trainingProgramId: trn3.id,
          employeeId: empFirst.id,
          enrolledDate: new Date("2026-07-25"),
          status: "IN_PROGRESS",
          score: 88,
        },
      });

      // Upcoming enrollment
      await prisma.trainingEnrollment.create({
        data: {
          trainingProgramId: trn1.id,
          employeeId: empFirst.id,
          enrolledDate: new Date("2026-08-10"),
          status: "ENROLLED",
        },
      });
    }

    console.log("Sample Training Programs, Enrollments & Certifications seeded");
  }

  // Seed sample Document Categories and Documents
  const existingDocCat = await prisma.documentCategory.findUnique({ where: { code: "CAT-DOC-CONTRACT" } });
  if (!existingDocCat) {
    const catContract = await prisma.documentCategory.create({
      data: { code: "CAT-DOC-CONTRACT", name: "Contracts & Agreements", description: "Employment contracts, NDAs, and probation letters." },
    });
    const catID = await prisma.documentCategory.create({
      data: { code: "CAT-DOC-ID", name: "Personal Identification & Passports", description: "Passports, national ID cards, work permits, and visas." },
    });
    const catPolicy = await prisma.documentCategory.create({
      data: { code: "CAT-DOC-POLICY", name: "Company Policies & Handbooks", description: "HR guidelines, code of conduct, safety policies, and employee handbooks." },
    });
    const catDegree = await prisma.documentCategory.create({
      data: { code: "CAT-DOC-CERT", name: "Educational Certificates & Diplomas", description: "University degrees, transcript copies, and professional certifications." },
    });

    // Seed Company Policy Documents
    await prisma.document.create({
      data: {
        documentNo: "DOC-POL-2026-001",
        title: "Employee Handbook & Corporate Code of Conduct 2026",
        categoryId: catPolicy.id,
        type: "COMPANY_POLICY",
        fileUrl: "https://example.com/docs/employee_handbook_2026.pdf",
        fileType: "application/pdf",
        fileSize: 2450000,
        issueDate: new Date("2026-01-01"),
        status: "ACTIVE",
        notes: "General corporate policy applicable to all employees.",
      },
    });

    await prisma.document.create({
      data: {
        documentNo: "DOC-POL-2026-002",
        title: "Information Security & Remote Work Policy",
        categoryId: catPolicy.id,
        type: "COMPANY_POLICY",
        fileUrl: "https://example.com/docs/infosec_remote_policy.pdf",
        fileType: "application/pdf",
        fileSize: 1250000,
        issueDate: new Date("2026-02-15"),
        status: "ACTIVE",
        notes: "IT security rules and VPN usage guidelines.",
      },
    });

    const empFirst = await prisma.user.findFirst({ where: { role: "EMPLOYEE" } });
    if (empFirst) {
      // Seed Employment Contract
      await prisma.document.create({
        data: {
          documentNo: "DOC-EMP-CON-001",
          title: `Full-Time Employment Agreement - ${empFirst.name}`,
          categoryId: catContract.id,
          type: "PERSONAL",
          fileUrl: "https://example.com/docs/contracts/emp_001_contract.pdf",
          fileType: "application/pdf",
          fileSize: 850000,
          ownerId: empFirst.id,
          issueDate: new Date("2025-01-10"),
          expiryDate: new Date("2027-01-10"),
          status: "ACTIVE",
          notes: "2-Year renewable employment contract",
        },
      });

      // Seed Passport Copy (Expiring Soon)
      await prisma.document.create({
        data: {
          documentNo: "DOC-EMP-PAS-001",
          title: `Passport Copy - ${empFirst.name}`,
          categoryId: catID.id,
          type: "PERSONAL",
          fileUrl: "https://example.com/docs/passports/emp_001_passport.pdf",
          fileType: "application/pdf",
          fileSize: 520000,
          ownerId: empFirst.id,
          issueDate: new Date("2021-09-01"),
          expiryDate: new Date(Date.now() + 20 * 86400000), // Expiring in 20 days
          status: "EXPIRING_SOON",
          notes: "Passport renewal required soon",
        },
      });

      // Seed Degree Certificate
      await prisma.document.create({
        data: {
          documentNo: "DOC-EMP-DEG-001",
          title: `B.Sc. Software Engineering Degree - ${empFirst.name}`,
          categoryId: catDegree.id,
          type: "PERSONAL",
          fileUrl: "https://example.com/docs/degrees/emp_001_degree.pdf",
          fileType: "application/pdf",
          fileSize: 1800000,
          ownerId: empFirst.id,
          issueDate: new Date("2022-07-05"),
          status: "ACTIVE",
          notes: "Verified university degree credential",
        },
      });
    }

    console.log("Sample Document Categories, Company Policies & Employee Vault Documents seeded");
  }

  // Seed sample Notifications
  const empFirst = await prisma.user.findFirst({ where: { role: "EMPLOYEE" } });
  if (adminUserRecord) {
    const existingAdminNotif = await prisma.notification.findFirst({ where: { userId: adminUserRecord.id } });
    if (!existingAdminNotif) {
      await prisma.notification.create({
        data: {
          userId: adminUserRecord.id,
          title: "New Job Application Received",
          message: "Candidate Haile Gebrselassie applied for Senior Frontend Developer.",
          type: "ATS",
          link: "/admin/ats/applications",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: adminUserRecord.id,
          title: "System Backup Completed",
          message: "Weekly HRMS database backup successfully stored.",
          type: "SYSTEM",
          link: "/admin",
          isRead: true,
          readAt: new Date(),
        },
      });
    }
  }

  if (empFirst) {
    const existingEmpNotif = await prisma.notification.findFirst({ where: { userId: empFirst.id } });
    if (!existingEmpNotif) {
      await prisma.notification.create({
        data: {
          userId: empFirst.id,
          title: "Annual Leave Approved",
          message: "Your annual leave request for 3 days starting next Monday has been approved.",
          type: "LEAVE",
          link: "/employee/leave",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: empFirst.id,
          title: "Hardware Asset Issued",
          message: "MacBook Pro M2 Max (AST-LAP-001) has been assigned to your employee account.",
          type: "ASSET",
          link: "/employee/assets",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: empFirst.id,
          title: "Document Expiration Warning",
          message: "Your Passport Copy document is expiring in 20 days. Please upload an updated copy.",
          type: "DOCUMENT",
          link: "/employee/documents",
          isRead: false,
        },
      });

      await prisma.notification.create({
        data: {
          userId: empFirst.id,
          title: "Company Holiday Announcement",
          message: "Office closed next Friday for Ethiopian New Year holiday celebrations.",
          type: "SYSTEM",
          link: "/employee/holidays",
          isRead: true,
          readAt: new Date(),
        },
      });
    }
  }

  console.log("Sample System Notifications seeded");

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
