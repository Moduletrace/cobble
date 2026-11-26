import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import HarnessGuessedModelNote from "./harness-guessed-model-note";
import type { HarnessModelOption } from "@/src/types";

const model = (capabilities_guessed?: boolean): HarnessModelOption => ({
    id: 908359,
    provider_id: 12,
    provider_name: "Liquid AI",
    slug: "lfm3-vl-2b",
    name: "lfm3-vl-2b",
    free: false,
    capabilities_guessed,
});

describe("HarnessGuessedModelNote", () => {
    test("says the capabilities are guessed for a model listed by id only", () => {
        const html = renderToString(<HarnessGuessedModelNote model={model(true)} />);

        expect(html).toContain("lists model ids only");
        expect(html).toContain("lfm3-vl-2b");
        expect(html).toContain("never calls tools");
    });

    test("says nothing for a model whose catalog declared its capabilities", () => {
        expect(renderToString(<HarnessGuessedModelNote model={model(false)} />)).toBe("");
        expect(renderToString(<HarnessGuessedModelNote model={model()} />)).toBe("");
        expect(renderToString(<HarnessGuessedModelNote />)).toBe("");
    });
});
