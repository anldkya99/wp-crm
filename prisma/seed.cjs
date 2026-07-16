const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const email = String(process.env.SEED_ADMIN_EMAIL ?? "").trim().toLowerCase();
  const password = String(process.env.SEED_ADMIN_PASSWORD ?? "");

  if (!email || !password) {
    throw new Error("SEED_ADMIN_EMAIL and SEED_ADMIN_PASSWORD are required.");
  }

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      platformRole: "COMPANY_ADMIN",
      status: "ACTIVE"
    },
    create: {
      name: "Panel Admin",
      email,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      platformRole: "COMPANY_ADMIN",
      status: "ACTIVE"
    }
  });

  console.log("Admin account ready.");
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
