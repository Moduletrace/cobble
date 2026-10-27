/**
 * Where the app serves a bot graphic (`bot_graphics`): `/graphics/<id>`,
 * sandboxed with no network and an origin of its own
 * (`handleGraphicsRequest`).
 */
export const GraphicsPrefix = "/graphics";

/**
 * Where the libraries a graphic may load are served: `/graphics-lib/<file>`.
 * A graphic reaches nothing else, so these ship with the app.
 */
export const GraphicsLibPrefix = "/graphics-lib";

/**
 * The libraries a graphic may load, by the file name it loads them under,
 * read from the app's own `node_modules`.
 */
export const GraphicsLibs = [
    {
        file: "chart.js",
        source: "node_modules/chart.js/dist/chart.umd.min.js",
        description: `Chart.js 4 (global \`Chart\`): bar, line, pie, doughnut, radar, scatter and bubble charts on a <canvas>`,
    },
    {
        file: "mermaid.js",
        source: "node_modules/mermaid/dist/mermaid.min.js",
        description: `Mermaid (global \`mermaid\`): flowcharts, sequence, class, state, ER, gantt, pie, mindmap and timeline diagrams from text in <pre class="mermaid">; call \`mermaid.initialize({ startOnLoad: true, theme: document.documentElement.classList.contains("dark") ? "dark" : "default" })\``,
    },
] as const;

/**
 * The message a graphic's frame posts to the page with its height, so the
 * thread sizes it to fit.
 */
export const GraphicSizeMessageType = "cobble:graphic-size";
