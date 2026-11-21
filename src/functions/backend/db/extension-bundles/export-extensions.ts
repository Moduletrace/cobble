import type { ExtensionBundle, ExtensionBundleKind } from "@/src/types";
import runningVersion from "@/src/utils/running-version";
import exportKnowledgebases from "./export-knowledgebases";
import exportMcps from "./export-mcps";
import exportSkills from "./export-skills";
import exportTools from "./export-tools";

type Params = {
    kind: ExtensionBundleKind;
    /**
     * The rows picked on the page, or none for every one.
     */
    ids: number[];
};

/**
 * One page's extensions as a file another install can import: a single
 * JSON document with the format's name and version in it, so a bundle of
 * every kind is the same shape later.
 */
export default async function exportExtensions({ kind, ids }: Params): Promise<ExtensionBundle> {
    const entries = await (kind == "mcp"
        ? exportMcps({ ids })
        : kind == "tool"
          ? exportTools({ ids })
          : kind == "skill"
            ? exportSkills({ ids })
            : exportKnowledgebases({ ids }));

    return {
        format: "cobble-extensions",
        version: 1,
        exported_at: Date.now(),
        app_version: runningVersion({ env: process.env }).version || "",
        items: entries.map((entry) => entry.item),
    };
}