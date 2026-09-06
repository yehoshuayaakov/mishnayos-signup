import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/voice/reminder/route";
import { validateTwilioSignature } from "@/lib/voice";

vi.mock("@/lib/voice", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/voice")>();
  return {
    ...actual,
    validateTwilioSignature: vi.fn(),
  };
});
vi.mock("@/lib/supabase", () => ({
  getSupabase: vi.fn(),
}));

const validate = vi.mocked(validateTwilioSignature);

describe("GET /api/voice/reminder", () => {
  beforeEach(() => {
    validate.mockReset();
  });

  it("hangs up without speaking when the Twilio signature is missing", async () => {
    validate.mockReturnValue(false);
    const res = await GET(new Request("http://localhost/api/voice/reminder?id=1"));
    const xml = await res.text();
    expect(xml).toContain("<Hangup/>");
    expect(xml).not.toContain("<Say");
  });
});
