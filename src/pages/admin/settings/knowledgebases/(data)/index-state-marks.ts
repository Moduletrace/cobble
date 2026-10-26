import { CircleAlert, CircleCheck, LoaderCircle, TriangleAlert, type LucideIcon } from "lucide-react";
import type { KnowledgebaseIndexState } from "@/src/utils/knowledgebase-index-state";

/**
 * The mark beside a knowledgebase or document for each index state, and
 * what it says on hover. Green only when bots search all of it by meaning.
 */
export const IndexStateMarks: Record<
    Exclude<KnowledgebaseIndexState, "empty">,
    { Icon: LucideIcon; label: string; className: string[] }
> = {
    indexing: { Icon: LoaderCircle, label: "Being read", className: ["animate-spin", "text-ink-secondary"] },
    failed: {
        Icon: TriangleAlert,
        label: "Something couldn't be read",
        className: ["text-warning", "dark:text-warning-dark"],
    },
    words: {
        Icon: CircleCheck,
        label: "Read, found by words only: no embedding model is set",
        className: ["text-ink-disabled"],
    },
    stale: {
        Icon: CircleAlert,
        label: "Read with another embedding model: needs re-indexing",
        className: ["text-ink-disabled"],
    },
    indexed: {
        Icon: CircleCheck,
        label: "Indexed: bots search all of it by meaning",
        className: ["text-success", "dark:text-success-dark"],
    },
};
