const { existsSync, readFileSync } = require("node:fs");
const { spawnSync } = require("node:child_process");
const path = require("node:path");

const TEST_DATABASE_NAME = "operation_pact_test";
const STOP_MESSAGE = `Islem durduruldu: Test komutu yalnizca ${TEST_DATABASE_NAME} veritabaninda calisabilir.`;
const root = process.cwd();
const action = process.argv[2] ?? "check";
const envFile = process.env.TEST_ENV_FILE || ".env.test";

const loadedEnv = loadEnvFile(path.join(root, envFile));
const commandEnv = {
  ...process.env,
  ...loadedEnv
};

try {
  assertTestDatabaseEnvironment(commandEnv);
  runAction(action, commandEnv);
} catch (error) {
  console.error(error instanceof Error ? error.message : STOP_MESSAGE);
  process.exitCode = 1;
}

function runAction(name, env) {
  if (name === "check") {
    console.log(`Test veritabani guvenlik kontrolu gecti: ${TEST_DATABASE_NAME}`);
    return;
  }

  if (name === "validate") return runPrisma(["validate"], env);
  if (name === "generate") return runPrisma(["generate"], env);
  if (name === "build") return runNext(["build"], env);
  if (name === "verify") {
    runAction("check", env);
    runAction("validate", env);
    runAction("generate", env);
    runAction("build", env);
    return;
  }
  if (name === "status") return runPrisma(["migrate", "status"], env);
  if (name === "migrate") return runPrisma(["migrate", "deploy"], env);
  if (name === "reset") return runPrisma(["migrate", "reset", "--force", "--skip-seed"], env);
  if (name === "seed") return runPrisma(["db", "seed"], env);

  throw new Error(`Bilinmeyen test veritabani komutu: ${name}`);
}

function assertTestDatabaseEnvironment(env) {
  const databaseUrl = String(env.DATABASE_URL ?? "").trim();
  if (!databaseUrl) throw new Error(`${STOP_MESSAGE} DATABASE_URL tanimli degil.`);

  const opEnvironment = String(env.OP_ENVIRONMENT ?? "").trim().toLowerCase();
  const nodeEnvironment = String(env.NODE_ENV ?? "").trim().toLowerCase();
  if (opEnvironment !== "test") {
    throw new Error(`${STOP_MESSAGE} OP_ENVIRONMENT=test olmalidir.`);
  }
  if (nodeEnvironment === "production" || opEnvironment === "production") {
    throw new Error(`${STOP_MESSAGE} Production isareti tespit edildi.`);
  }

  let parsed;
  try {
    parsed = new URL(databaseUrl);
  } catch {
    throw new Error(`${STOP_MESSAGE} DATABASE_URL gecersiz.`);
  }

  const databaseName = decodeURIComponent(parsed.pathname.replace(/^\//, ""));
  if (databaseName !== TEST_DATABASE_NAME) {
    throw new Error(`${STOP_MESSAGE} Tespit edilen veritabani: ${databaseName || "(bos)"}.`);
  }
}

function runPrisma(args, env) {
  return run(process.execPath, [require.resolve("prisma/build/index.js"), ...args], env);
}

function runNext(args, env) {
  return run(process.execPath, [require.resolve("next/dist/bin/next"), ...args], env);
}

function run(command, args, env) {
  const result = spawnSync(command, args, {
    cwd: root,
    env,
    shell: false,
    stdio: "inherit"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exitCode = result.status ?? 1;
}

function loadEnvFile(filePath) {
  if (!existsSync(filePath)) return {};

  return readFileSync(filePath, "utf8")
    .split(/\r?\n/)
    .reduce((env, rawLine) => {
      const line = rawLine.trim();
      if (!line || line.startsWith("#")) return env;
      const separatorIndex = line.indexOf("=");
      if (separatorIndex === -1) return env;
      const key = line.slice(0, separatorIndex).trim();
      const value = stripQuotes(line.slice(separatorIndex + 1).trim());
      if (key) env[key] = value;
      return env;
    }, {});
}

function stripQuotes(value) {
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    return value.slice(1, -1);
  }
  return value;
}
