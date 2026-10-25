import { describe, expect, test } from "bun:test";
import describeTemplateMap from "./describe-template-map";

describe("describeTemplateMap", () => {
    test("shows templates and hides literal values", () => {
        expect(
            describeTemplateMap({
                map: { Authorization: "{{env.API_KEY}}", "X-Token": "sk-live-123", Mixed: "Bearer {{env.KEY}}" },
            }),
        ).toBe("Authorization: {{env.API_KEY}}; X-Token: (set); Mixed: Bearer {{env.KEY}}");
    });

    test("says none for an empty map", () => {
        expect(describeTemplateMap({ map: {} })).toBe("none");
    });
});
