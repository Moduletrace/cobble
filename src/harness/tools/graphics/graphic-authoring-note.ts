import { AppData } from "@/src/data/app-data";
import { GraphicsLibPrefix, GraphicsLibs } from "@/src/dict/graphics-dict";

/**
 * How a graphic's HTML must be written, in the tool descriptions: what the
 * sandbox lets it load and the theme it can draw with.
 */
export const GraphicAuthoringNote = `Write one self-contained HTML document (or a fragment), up to ${AppData.BotGraphicMaxChars} characters: inline <style>, <svg> and <script>. It runs sandboxed with no network: outside URLs (CDNs, fetch, remote images or fonts, links that leave) are blocked, so put the data in the document. The only scripts you can load are these, by exactly these tags:
${GraphicsLibs.map((lib) => `- <script src="${GraphicsLibPrefix}/${lib.file}"></script>: ${lib.description}`).join("\n")}
The app's theme is set as CSS variables: var(--c-paper) (the background, already applied to body), var(--c-surface), var(--c-sunken), var(--c-ink) (text), var(--c-ink-secondary), var(--c-border), var(--c-border-strong), var(--font-sans), var(--font-mono). The root has the class "dark" in the dark theme: use the variables, or pick colours that read on both. It shows about 700px wide in the chat and full screen when opened, so keep it responsive; its height grows to fit.`;
