import { describe, expect, test } from "bun:test";
import unresolvedSettingRefs from "./unresolved-setting-refs";

describe("unresolvedSettingRefs", () => {
    test("finds nothing in refs the app can open", () => {
        expect(
            unresolvedSettingRefs({
                text: "The reply limit is 20 steps ([setting:run-limits:reply_steps]), see also [setting:run-limits].",
            }),
        ).toEqual([]);
    });

    test("keeps a section that doesn't exist, and a field its section doesn't have", () => {
        expect(unresolvedSettingRefs({ text: "Raise [setting:run-limit:reply_steps] or [setting:run-limits:reply_step]." })).toEqual([
            "[setting:run-limit:reply_steps]",
            "[setting:run-limits:reply_step]",
        ]);
    });

    test("a group with no fields can still be named on its own", () => {
        expect(unresolvedSettingRefs({ text: "See [setting:theme]." })).toEqual([]);
        expect(unresolvedSettingRefs({ text: "See [setting:theme:dark]." })).toEqual(["[setting:theme:dark]"]);
    });

    test("counts a repeated broken ref once", () => {
        expect(unresolvedSettingRefs({ text: "[setting:nope] and [setting:nope] again" })).toEqual(["[setting:nope]"]);
    });
});