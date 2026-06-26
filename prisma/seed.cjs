const { PrismaClient } = require("@prisma/client");
const { randomBytes, scryptSync } = require("crypto");

const prisma = new PrismaClient();

function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL || "admin@panel.local";
  const password = process.env.SEED_ADMIN_PASSWORD || "Admin123!";

  await prisma.user.upsert({
    where: { email },
    update: {
      role: "ADMIN",
      status: "ACTIVE"
    },
    create: {
      name: "Panel Admin",
      email,
      passwordHash: hashPassword(password),
      role: "ADMIN",
      status: "ACTIVE"
    }
  });

  console.log(`Admin hazır: ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
