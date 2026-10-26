import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    /**
     * The install's embedding model, null when none is set.
     */
    model: string | null;
};

/**
 * Which model turns every knowledgebase into vectors: one for the whole
 * install, picked under Settings > Models. Without one, bots still find
 * passages by their words. Picking or changing it reads every document
 * again (`reindexAfterEmbeddingChange`).
 */
export default function EmbeddingModelNote({ model }: Props) {
    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary">
            {model
                ? `Searched by meaning with ${model}, the install's embedding model. Change it under `
                : "No embedding model is set, so bots find passages by their words only, which misses questions worded differently. Pick one under "}
            <Link href="/admin/settings/models" title="Models settings" className="text-ink underline">
                Settings, Models
            </Link>
            {model
                ? "; every document is then read again with the new one."
                : "; every document is then read again with it."}
        </Span>
    );
}
