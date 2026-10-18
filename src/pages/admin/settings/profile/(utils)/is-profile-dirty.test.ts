import { describe, expect, test } from "bun:test";
import isProfileDirty from "./is-profile-dirty";

const existing = {
    first_name: "Ben",
    last_name: "",
    email: "ben@example.com",
    username: "ben",
    bio: "",
};

describe("isProfileDirty", () => {
    test("unchanged, or only whitespace changed, is clean", () => {
        expect(isProfileDirty({ form: { ...existing }, existing })).toBe(false);
        expect(
            isProfileDirty({ form: { ...existing, first_name: " Ben " }, existing }),
        ).toBe(false);
    });

    test("a changed field or a new photo is dirty", () => {
        expect(
            isProfileDirty({ form: { ...existing, username: "benji" }, existing }),
        ).toBe(true);
        expect(
            isProfileDirty({
                form: { ...existing },
                existing,
                image: { imageBase64Full: "data:image/png;base64,AAAA" },
            }),
        ).toBe(true);
    });
});
