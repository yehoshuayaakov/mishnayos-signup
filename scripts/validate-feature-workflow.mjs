import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const STAGES = [
  {
    key: "spec",
    file: "01-spec.md",
    headings: ["Problem", "Users and permissions", "Scope", "Requirements", "Acceptance criteria", "Security and privacy", "Handoff"],
  },
  {
    key: "plan",
    file: "02-implementation-plan.md",
    headings: ["Approved inputs", "Architecture and approach", "Requirement mapping", "Security and privacy", "Test strategy", "Handoff"],
  },
  {
    key: "implementation",
    file: "03-implementation-report.md",
    headings: ["Approved inputs", "Delivered behavior", "Changed files", "Verification performed", "Deviations", "Handoff"],
  },
  {
    key: "test-map",
    file: "04-test-map.md",
    headings: ["Inputs reconciled", "Behavior inventory", "Traceability map", "Test gaps", "Mutation scope", "Handoff"],
  },
  {
    key: "tests",
    file: "05-test-report.md",
    headings: ["Test-map inputs", "Tests added or changed", "Results", "Remaining gaps", "Mutation readiness", "Handoff"],
  },
  {
    key: "mutation",
    file: "06-mutation-report.md",
    headings: ["Scope", "Baseline", "Survivor analysis", "Final result", "Handoff"],
  },
  {
    key: "delivery",
    file: "07-delivery-summary.md",
    headings: ["Delivered outcome", "Traceability", "Documentation updated", "Deployment and rollback", "Quality evidence", "Handoff"],
  },
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function identifiers(markdown, prefix) {
  const matches = markdown.match(new RegExp(`\\b${prefix}-[A-Z0-9-]+-\\d{3}\\b`, "g")) ?? [];
  return [...new Set(matches)];
}

function hasHeading(markdown, heading) {
  return new RegExp(`^## ${escapeRegExp(heading)}\\s*$`, "m").test(markdown);
}

async function readArtifact(featureDir, stage, errors) {
  const artifactPath = path.join(featureDir, stage.file);
  try {
    const content = await readFile(artifactPath, "utf8");
    for (const heading of stage.headings) {
      if (!hasHeading(content, heading)) {
        errors.push(`${stage.file}: missing "## ${heading}"`);
      }
    }
    if (!/- Status:\s*ready-for-review\b/i.test(content)) {
      errors.push(`${stage.file}: handoff status must be ready-for-review`);
    }
    if (!/- Open decisions:\s*none\b/i.test(content)) {
      errors.push(`${stage.file}: handoff must have no open decisions`);
    }
    return content;
  } catch (error) {
    if (error && error.code === "ENOENT") {
      errors.push(`${stage.file}: missing required artifact`);
      return "";
    }
    throw error;
  }
}

export async function validateFeatureWorkflow(featureDirectory, through = "delivery") {
  const featureDir = path.resolve(featureDirectory);
  const targetIndex = STAGES.findIndex((stage) => stage.key === through);
  if (targetIndex === -1) {
    return {
      ok: false,
      errors: [`Unknown stage "${through}". Use: ${STAGES.map((stage) => stage.key).join(", ")}`],
    };
  }

  const errors = [];
  const contents = new Map();
  for (const stage of STAGES.slice(0, targetIndex + 1)) {
    contents.set(stage.key, await readArtifact(featureDir, stage, errors));
  }

  const spec = contents.get("spec") ?? "";
  const requiredIds = {
    REQ: identifiers(spec, "REQ"),
    AC: identifiers(spec, "AC"),
    RISK: identifiers(spec, "RISK"),
  };

  for (const [prefix, ids] of Object.entries(requiredIds)) {
    if (ids.length === 0) errors.push(`01-spec.md: define at least one ${prefix}-* identifier`);
  }

  if (targetIndex >= 1) {
    const plan = contents.get("plan") ?? "";
    for (const id of [...requiredIds.REQ, ...requiredIds.AC, ...requiredIds.RISK]) {
      if (!plan.includes(id)) errors.push(`02-implementation-plan.md: missing traceability for ${id}`);
    }
  }

  if (targetIndex >= 3) {
    const testMap = contents.get("test-map") ?? "";
    for (const id of [...requiredIds.REQ, ...requiredIds.AC, ...requiredIds.RISK]) {
      if (!testMap.includes(id)) errors.push(`04-test-map.md: missing traceability for ${id}`);
    }
  }

  if (targetIndex >= 6) {
    const delivery = contents.get("delivery") ?? "";
    for (const id of [...requiredIds.REQ, ...requiredIds.AC, ...requiredIds.RISK]) {
      if (!delivery.includes(id)) errors.push(`07-delivery-summary.md: missing traceability for ${id}`);
    }
  }

  return { ok: errors.length === 0, errors };
}

async function main() {
  const args = process.argv.slice(2);
  const featureDir = args[0];
  const throughIndex = args.indexOf("--through");
  const through = throughIndex >= 0 ? args[throughIndex + 1] : "delivery";

  if (!featureDir || !through) {
    console.error("Usage: npm run workflow:validate -- docs/features/<feature> [--through <stage>]");
    process.exitCode = 1;
    return;
  }

  const result = await validateFeatureWorkflow(featureDir, through);
  if (!result.ok) {
    console.error(result.errors.map((error) => `- ${error}`).join("\n"));
    process.exitCode = 1;
    return;
  }
  console.log(`Feature workflow valid through ${through}: ${featureDir}`);
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) await main();
