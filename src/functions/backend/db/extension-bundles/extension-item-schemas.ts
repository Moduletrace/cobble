import { SaveKnowledgebaseRequestSchema } from "@/src/schemas/knowledgebase-schema";
import {
    SaveCustomToolRequestSchema,
    SaveMcpServerRequestSchema,
    SaveSkillRequestSchema,
} from "@/src/schemas/extension-schema";
import type { ExtensionBundleKind } from "@/src/types";

/**
 * The schema a bundle's item of this kind is read with: the same one the
 * row's own form saves through, so an import can never write a row the
 * form would refuse.
 */
const Schemas = {
    mcp: SaveMcpServerRequestSchema,
    tool: SaveCustomToolRequestSchema,
    skill: SaveSkillRequestSchema,
    knowledgebase: SaveKnowledgebaseRequestSchema,
};

export default function extensionItemSchema({ kind }: { kind: ExtensionBundleKind }) {
    return Schemas[kind];
}