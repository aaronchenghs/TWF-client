import { existsSync } from "node:fs";
import { spawnSync } from "node:child_process";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const PROD_BUILD_ENV = {
  VITE_SOCKET_URL: "https://api.tierswithfriends.com",
  VITE_ENABLE_DEBUG_CONTROLS: "false",
  VITE_SITE_URL: "https://www.tierswithfriends.com",
};

const DEPLOY_CONFIG = {
  appUrl: "https://www.tierswithfriends.com",
  bucket: "s3://www.tierswithfriends.com",
  distributionId: "E231SUU13SS6IL",
  region: "us-east-1",
};

const scriptDir = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(scriptDir, "..");
const distDir = resolve(repoRoot, "dist");
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

const args = new Set(process.argv.slice(2));
const isDryRun = args.has("--dry-run");
const shouldSkipBuild = args.has("--skip-build");
const shouldShowHelp = args.has("--help") || args.has("-h");

if (shouldShowHelp) {
  printUsage();
  process.exit(0);
}

runDeployment();

function runDeployment() {
  if (isDryRun) {
    printPlan();
    return;
  }

  if (!shouldSkipBuild) {
    runCommand("Building frontend bundle", npmCommand, ["run", "build"], {
      env: {
        ...process.env,
        ...PROD_BUILD_ENV,
      },
    });
  }

  if (!existsSync(distDir)) {
    fail(
      `Missing build output at "${distDir}". Run the build first or omit --skip-build.`,
    );
  }

  const awsEnv = {
    ...process.env,
    AWS_DEFAULT_REGION: process.env.AWS_DEFAULT_REGION ?? DEPLOY_CONFIG.region,
  };

  runCommand(
    "Uploading dist/ to the production S3 bucket",
    "aws",
    ["s3", "sync", "dist", DEPLOY_CONFIG.bucket, "--delete"],
    { env: awsEnv },
  );

  runCommand(
    "Creating CloudFront invalidation",
    "aws",
    [
      "cloudfront",
      "create-invalidation",
      "--distribution-id",
      DEPLOY_CONFIG.distributionId,
      "--paths",
      "/*",
    ],
    { env: awsEnv },
  );

  console.log(`Frontend deployment complete: ${DEPLOY_CONFIG.appUrl}`);
}

function runCommand(label, command, commandArgs, options = {}) {
  console.log(`\n${label}`);
  console.log(`> ${formatCommand(command, commandArgs, options.env)}`);

  const invocation = resolveCommandInvocation(command, commandArgs);
  const result = spawnSync(invocation.command, invocation.args, {
    cwd: repoRoot,
    stdio: "inherit",
    env: options.env,
  });

  if (result.error)
    fail(`Failed to start "${invocation.command}": ${result.error.message}`);

  if (result.status !== 0) process.exit(result.status ?? 1);
}

function resolveCommandInvocation(command, commandArgs) {
  if (process.platform !== "win32" || !isWindowsCommandScript(command)) {
    return { command, args: commandArgs };
  }

  const comSpec = process.env.ComSpec ?? "cmd.exe";
  return {
    command: comSpec,
    args: ["/d", "/s", "/c", formatWindowsCmdInvocation(command, commandArgs)],
  };
}

function isWindowsCommandScript(command) {
  return command.toLowerCase().endsWith(".cmd");
}

function formatWindowsCmdInvocation(command, commandArgs) {
  return [command, ...commandArgs].map(quoteWindowsCmdArg).join(" ");
}

function quoteWindowsCmdArg(value) {
  if (!value) return '""';
  if (!/[\s"]/u.test(value)) return value;
  return `"${value.replace(/"/g, '\\"')}"`;
}

function formatCommand(command, commandArgs, env) {
  const envEntries = Object.entries(PROD_BUILD_ENV)
    .filter(([key]) => env?.[key])
    .map(([key]) => `${key}=${env[key]}`);
  const parts = [...envEntries, command, ...commandArgs];
  return parts.join(" ");
}

function printPlan() {
  console.log("Frontend production deploy dry run");
  console.log(`Repo root: ${repoRoot}`);
  console.log(`App URL: ${DEPLOY_CONFIG.appUrl}`);
  console.log(`S3 bucket: ${DEPLOY_CONFIG.bucket}`);
  console.log(`CloudFront distribution: ${DEPLOY_CONFIG.distributionId}`);
  console.log(`AWS region: ${DEPLOY_CONFIG.region}`);

  if (!shouldSkipBuild) {
    console.log(
      `\n1. Build with: ${formatCommand(npmCommand, ["run", "build"], PROD_BUILD_ENV)}`,
    );
  } else {
    console.log("\n1. Skipping build because --skip-build was provided");
  }

  console.log(
    `2. Sync assets: ${formatCommand("aws", ["s3", "sync", "dist", DEPLOY_CONFIG.bucket, "--delete"])}`,
  );
  console.log(
    `3. Invalidate CDN: ${formatCommand("aws", ["cloudfront", "create-invalidation", "--distribution-id", DEPLOY_CONFIG.distributionId, "--paths", "/*"])}`,
  );
}

function printUsage() {
  console.log(
    "Usage: node scripts/deploy-frontend.mjs [--dry-run] [--skip-build]",
  );
  console.log("");
  console.log("Deploys the frontend bundle to the production S3 bucket and");
  console.log(
    "creates a CloudFront invalidation using the values in DEPLOYMENT.md.",
  );
}

function fail(message) {
  console.error(message);
  process.exit(1);
}
