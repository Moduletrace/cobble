import { useContext, useEffect, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { KnowledgebasesOverviewPayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import EmbeddingModelNote from "../(partials)/embedding-model-note";
import KnowledgebaseModal from "../(partials)/knowledgebase-modal";
import KnowledgebaseRow from "../(partials)/knowledgebase-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * How often the list is read again while a document is being read.
 */
const PollMs = 4000;

/**
 * Every knowledgebase with who gets it. Super admins add, fill, edit and
 * delete them; admins choose which bots and workspaces get each one.
 */
export default function KnowledgebasesSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState(pageProps?.knowledgebases_overview);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();
    /**
     * Remounts the rows when the data changes under them.
     */
    const [version, setVersion] = useState(0);

    const reading = Boolean(overview?.knowledgebases.some((knowledgebase) => knowledgebase.pending_count));

    /**
     * Kept current while documents are read, so the marks beside them
     * turn from spinners into checks. The rows aren't remounted: a modal
     * open on one stays.
     */
    useEffect(() => {
        if (!reading) return;

        const timer = setInterval(async () => {
            const res = await postAdminApi<KnowledgebasesOverviewPayload>({ path: "knowledgebases/overview", body: {} });

            if (res.success && res.singleRes) setOverview(res.singleRes);
        }, PollMs);

        return () => clearInterval(timer);
    }, [reading]);

    if (!overview) return null;

    const changed = (next: KnowledgebasesOverviewPayload, msg: string) => {
        setOverview(next);
        setStatus(msg ? { success: true, msg } : undefined);
        setVersion((prev) => prev + 1);
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <SettingsGroup
            title="Knowledgebases"
            description="A set of documents (handbooks, policies, product notes) a bot searches for the passages that answer a question. Before every reply it's handed the passages that fit the newest message, and it can search again while it works. Give one to a bot on its settings page or in its chat, or to a workspace to reach every bot there."
        >
            <EmbeddingModelNote model={overview.embedding_model} />
            {adding ? (
                <KnowledgebaseModal
                    onSaved={(next, msg) => {
                        setAdding(false);
                        changed(next, msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
            <SettingsList is_empty={!overview.knowledgebases.length} empty="No knowledgebases yet.">
                {overview.knowledgebases.map((knowledgebase) => (
                    <KnowledgebaseRow
                        key={`${knowledgebase.id}-${version}`}
                        knowledgebase={knowledgebase}
                        targets={overview}
                        embedding_model={overview.embedding_model}
                        onChanged={changed}
                        onError={failed}
                    />
                ))}
            </SettingsList>
            {overview.can_edit && !adding ? (
                <Button
                    title="Add a knowledgebase"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    onClick={() => setAdding(true)}
                    className="self-start gap-1!"
                >
                    <Plus size={14} aria-hidden />
                    New knowledgebase
                </Button>
            ) : null}
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
