const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();
const keyLength = 64;

function normalizeEmail(value) {
  return String(value ?? "").trim().toLowerCase();
}

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, keyLength).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

function validateEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validatePassword(password) {
  if (password.length < 12) return false;
  if (!/[a-z]/.test(password)) return false;
  if (!/[A-Z]/.test(password)) return false;
  if (!/[0-9]/.test(password)) return false;
  if (!/[^A-Za-z0-9]/.test(password)) return false;
  return true;
}

async function main() {
  const email = normalizeEmail(process.env.OP_CEO_EMAIL);
  const password = String(process.env.OP_CEO_PASSWORD ?? "");
  const name = String(process.env.OP_CEO_NAME ?? "OP CEO").trim() || "OP CEO";

  if (!email || !validateEmail(email)) {
    throw new Error("OP_CEO_EMAIL is required and must be a valid email address.");
  }

  if (!password || !validatePassword(password)) {
    throw new Error("OP_CEO_PASSWORD must be at least 12 characters and include lowercase, uppercase, number, and symbol characters.");
  }

  const existingPlatformOwners = await prisma.user.findMany({
    where: { platformRole: "OP_CEO" },
    select: { id: true, email: true }
  });
  const targetOwner = existingPlatformOwners.find((user) => user.email.toLowerCase() === email);

  if (existingPlatformOwners.length > 0 && !targetOwner) {
    throw new Error("An OP CEO account already exists. Refusing to create a second platform owner.");
  }

  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true }
  });

  if (existingUser) {
    await prisma.user.update({
      where: { email },
      data: {
        name,
        passwordHash: hashPassword(password),
        role: "ADMIN",
        platformRole: "OP_CEO",
        status: "ACTIVE",
        companyId: null,
        departmentId: null,
        teamLeadId: null
      }
    });
    console.log("OP CEO account updated.");
    return;
  }

  await prisma.user.create({
    data: {
      name,
      email,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      platformRole: "OP_CEO",
      status: "ACTIVE",
      companyId: null,
      departmentId: null,
      teamLeadId: null
    }
  });
  console.log("OP CEO account created.");
}

main()
  .catch((error) => {
    console.error(error.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
