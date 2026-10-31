const { spawnSync } = require("node:child_process");

const cases = [
  {
    name: "Eksik DATABASE_URL reddedilir",
    env: { OP_ENVIRONMENT: "test" },
    shouldPass: false,
    expectedOutput: "DATABASE_URL tanimli degil"
  },
  {
    name: "Yanlis veritabani adi reddedilir",
    env: {
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/whatsapp_ops?schema=public",
      OP_ENVIRONMENT: "test"
    },
    shouldPass: false,
    expectedOutput: "operation_pact_test"
  },
  {
    name: "Production isareti reddedilir",
    env: {
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/operation_pact_test?schema=public",
      OP_ENVIRONMENT: "production",
      NODE_ENV: "production"
    },
    shouldPass: false,
    expectedOutput: "OP_ENVIRONMENT=test"
  },
  {
    name: "Dogru test veritabani kabul edilir",
    env: {
      DATABASE_URL: "postgresql://user:password@127.0.0.1:5432/operation_pact_test?schema=public",
      OP_ENVIRONMENT: "test",
      NODE_ENV: "test"
    },
    shouldPass: true,
    expectedOutput: "guvenlik kontrolu gecti"
  }
];

let failed = false;

for (const testCase of cases) {
  const result = spawnSync(process.execPath, ["scripts/test-db-guard.cjs", "check"], {
    env: {
      PATH: process.env.PATH,
      SystemRoot: process.env.SystemRoot,
      ComSpec: process.env.ComSpec,
      TEST_ENV_FILE: ".env.test.missing",
      ...testCase.env
    },
    encoding: "utf8",
    shell: false
  });
  const output = `${result.stdout ?? ""}${result.stderr ?? ""}`;
  const passed = testCase.shouldPass ? result.status === 0 : result.status !== 0;
  const included = output.includes(testCase.expectedOutput);

  if (passed && included) {
    console.log(`PASS ${testCase.name}`);
    continue;
  }

  failed = true;
  console.error(`FAIL ${testCase.name}`);
  console.error(output.trim());
}

if (failed) process.exitCode = 1;
