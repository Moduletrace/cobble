import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import SettingRefChip from "./setting-ref-chip";

describe("SettingRefChip", () => {
    test("names the group and the field, and links to the field's anchor", () => {
        const html = renderToString(<SettingRefChip section="run-limits" field="reply_steps" />);

        expect(html).toContain("Run limits · Tool steps per chat reply");
        expect(html).toContain("/admin/settings/general/run-limits#reply_steps");
    });

    test("a group on its own links to its page", () => {
        const html = renderToString(<SettingRefChip section="storage" />);

        expect(html).toContain("Storage");
        expect(html).toContain("/admin/settings/general/storage");
        expect(html).not.toContain("#");
    });

    test("a ref the app can't resolve keeps its words, without linking anywhere", () => {
        const html = renderToString(<SettingRefChip section="nope" field="thing" />);

        expect(html).toContain("setting nope thing");
        expect(html).not.toContain("href");
    });
});