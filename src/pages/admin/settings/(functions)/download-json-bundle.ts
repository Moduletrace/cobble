import type { ExtensionBundle, ExtensionBundleKind } from "@/src/types";

const KindNames = {
    mcp: "mcp-servers",
    tool: "tools",
    skill: "skills",
    knowledgebase: "knowledgebases",
};

/**
 * How long the object URL is kept, so the browser has read it before it
 * is let go: revoking it as the click returns can cancel the save.
 */
const UrlKeepMs = 10_000;

type Params = {
    bundle: ExtensionBundle;
    kind: ExtensionBundleKind;
};

/**
 * Saves a bundle the browser already has as a JSON file, named for the
 * page and the day it was exported so two exports don't overwrite each
 * other.
 */
export default function downloadJsonBundle({ bundle, kind }: Params) {
    const day = new Date().toISOString().slice(0, 10);
    const blob = new Blob([JSON.stringify(bundle, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `cobble-${KindNames[kind]}-${day}.json`;
    link.rel = "noopener";
    document.body.append(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), UrlKeepMs);
}