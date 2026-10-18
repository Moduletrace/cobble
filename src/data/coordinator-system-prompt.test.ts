import { describe, expect, test } from "bun:test";
import { CoordinatorSystemPrompt } from "./coordinator-system-prompt";
import { SiteData } from "./site-data";

describe("CoordinatorSystemPrompt", () => {
    test("is markdown that opens with the coordinator heading", () => {
        expect(CoordinatorSystemPrompt.startsWith("# You are the Coordinator")).toBe(
            true,
        );
        expect(CoordinatorSystemPrompt).toContain("## Rules");
    });

    test("names the product from SiteData, with no em dashes", () => {
        expect(CoordinatorSystemPrompt).toContain(SiteData["SiteName"]);
        expect(CoordinatorSystemPrompt).not.toContain(String.fromCharCode(0x2014));
    });
});
