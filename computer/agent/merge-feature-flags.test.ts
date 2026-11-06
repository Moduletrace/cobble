import { describe, expect, test } from "bun:test";
import mergeFeatureFlags from "./merge-feature-flags";

describe("mergeFeatureFlags", () => {
    test("folds every --disable-features into one, at the first one's place", () => {
        expect(
            mergeFeatureFlags({
                args: ["--a", "--disable-features=Translate,MediaRouter", "--b", "--disable-features=MediaRouter,Foo"],
            }),
        ).toEqual(["--a", "--disable-features=Translate,MediaRouter,Foo", "--b"]);
    });

    test("keeps --enable-features apart from --disable-features", () => {
        expect(mergeFeatureFlags({ args: ["--enable-features=A", "--disable-features=B", "--enable-features=C"] })).toEqual([
            "--enable-features=A,C",
            "--disable-features=B",
        ]);
    });

    test("leaves other flags alone and drops an empty list", () => {
        expect(mergeFeatureFlags({ args: ["--mute-audio", "--disable-features="] })).toEqual(["--mute-audio"]);
    });
});
