import { describe, expect, test } from "bun:test";
import { renderToString } from "react-dom/server";
import TracePanel from "./trace-panel";

/**
 * The debug logs sit under the thinking row as a fixed-height strip, so the
 * thread above keeps its place while a run streams into it.
 */
describe("TracePanel", () => {
    test("a quarter-screen strip with nothing to stream yet", () => {
        const html = renderToString(<TracePanel session_id={null} open />);

        expect(html).toContain("h-[250px]");
        expect(html).toContain('aria-label="Debug logs"');
        expect(html).toContain("Nothing is running here.");
    });
});