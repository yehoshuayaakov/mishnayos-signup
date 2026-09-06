import { afterEach, describe, expect, it } from "vitest";
import { mkdtemp, mkdir, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import {
  STAGES,
  validateFeatureWorkflow,
} from "./validate-feature-workflow.mjs";

const temporaryDirectories = [];
const IDS = "REQ-PILOT-001 AC-PILOT-001 RISK-PILOT-001";

async function featureDirectory() {
  const root = await mkdtemp(path.join(os.tmpdir(), "feature-workflow-"));
  temporaryDirectories.push(root);
  const feature = path.join(root, "pilot");
  await mkdir(feature);
  return feature;
}

function artifact(stage, includeIds = true) {
  const sections = stage.headings.map((heading) => {
    if (heading === "Handoff") {
      return "## Handoff\n\n- Status: ready-for-review\n- Open decisions: none";
    }
    return `## ${heading}\n\n${includeIds ? IDS : "Documented behavior."}`;
  });
  return `# ${stage.key}\n\n${sections.join("\n\n")}\n`;
}

async function writeStages(directory, through = "delivery") {
  const target = STAGES.findIndex((stage) => stage.key === through);
  for (const stage of STAGES.slice(0, target + 1)) {
    await writeFile(path.join(directory, stage.file), artifact(stage), "utf8");
  }
}

afterEach(async () => {
  await Promise.all(
    temporaryDirectories.splice(0).map((directory) =>
      rm(directory, { recursive: true, force: true })
    )
  );
});

describe("validateFeatureWorkflow", () => {
  it("accepts a complete traceable feature artifact chain", async () => {
    const directory = await featureDirectory();
    await writeStages(directory);

    await expect(validateFeatureWorkflow(directory)).resolves.toEqual({
      ok: true,
      errors: [],
    });
  });

  it("rejects a missing required stage artifact", async () => {
    const directory = await featureDirectory();
    await writeFile(path.join(directory, STAGES[0].file), artifact(STAGES[0]), "utf8");

    const result = await validateFeatureWorkflow(directory, "plan");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain("02-implementation-plan.md: missing required artifact");
  });

  it("rejects broken requirement traceability", async () => {
    const directory = await featureDirectory();
    await writeFile(path.join(directory, STAGES[0].file), artifact(STAGES[0]), "utf8");
    await writeFile(path.join(directory, STAGES[1].file), artifact(STAGES[1], false), "utf8");

    const result = await validateFeatureWorkflow(directory, "plan");
    expect(result.ok).toBe(false);
    expect(result.errors).toContain(
      "02-implementation-plan.md: missing traceability for REQ-PILOT-001"
    );
  });
});
