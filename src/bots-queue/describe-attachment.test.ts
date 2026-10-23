import { describe, expect, test } from "bun:test";
import describeAttachment from "./describe-attachment";

describe("describeAttachment", () => {
    test("names the upload and its media id, so a tool can be given it", () => {
        expect(describeAttachment({ name: "summit-logo.png", id: 42 })).toBe(
            `"summit-logo.png", media id 42`,
        );
    });

    test("takes the id as text as well as a number", () => {
        expect(describeAttachment({ name: "logo.svg", id: "7" })).toBe(`"logo.svg", media id 7`);
    });
});
