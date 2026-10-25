import { useEffect, useState } from "react";
import Select from "@moduletrace/twui/form/Select";
import Span from "@moduletrace/twui/layout/Span";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BotSessionListItem, HookPlace, HookSessionChoice } from "@/src/types";

type Props = {
    bot_id: number;
    workspace_id: number | null;
    session: HookSessionChoice;
    /**
     * The hook's own session as saved, so it's offered even when it's
     * older than the sessions listed.
     */
    saved_session?: { id: number; title?: string | null } | null;
    disabled?: boolean;
    onChange: (params: { workspace_id: number | null; session: HookSessionChoice }) => void;
};

/**
 * Where a hook's calls run: the bot's own chat or one of its workspaces
 * (loaded when the form opens), then, there, which session they land in:
 * the active one whichever it is, a new one of its own, or one of the
 * sessions already there (loaded for the place picked). Picking another
 * place starts on a new session.
 */
export default function HookPlaceFields({ bot_id, workspace_id, session, saved_session, disabled, onChange }: Props) {
    const [places, setPlaces] = useState<HookPlace[]>();
    const [sessions, setSessions] = useState<BotSessionListItem[]>();
    const [error, setError] = useState<string>();

    useEffect(() => {
        postAdminApi<HookPlace>({ path: "hooks/hook-places", body: { bot_id } }).then((res) => {
            if (!res.success) setError(res.msg || "Couldn't load where it can run.");

            setPlaces((res.payload || []) as HookPlace[]);
        });
    }, [bot_id]);

    useEffect(() => {
        setSessions(undefined);

        postAdminApi<BotSessionListItem>({ path: "bots/list-sessions", body: { bot_id, workspace_id } }).then((res) => {
            setSessions((res.payload || []) as BotSessionListItem[]);
        });
    }, [bot_id, workspace_id]);

    const listed = sessions || [];
    const extra =
        saved_session?.id && !listed.some((it) => it.id == saved_session.id) ? [{ ...saved_session, status: "closed" }] : [];

    const session_options = [
        { value: "current", title: "The active session, whichever it is" },
        { value: "new", title: "A new session of its own" },
        ...[...extra, ...listed].map((it) => ({
            value: String(it.id),
            title: `${it.title || `Session ${it.id}`}${it.status == "active" ? " (active now)" : ""}`,
        })),
    ];

    return (
        <>
            {places?.length ? (
                <Select
                    key={`place-${places.length}`}
                    id="hook-place"
                    title="Runs in"
                    label="Runs in"
                    showLabel
                    disabled={disabled}
                    options={places.map((it) => ({
                        value: String(it.workspace_id ?? "own"),
                        title: it.name,
                        default: it.workspace_id == workspace_id,
                    }))}
                    changeHandler={(value) => onChange({ workspace_id: value == "own" ? null : Number(value), session: "new" })}
                />
            ) : null}
            {sessions ? (
                <Select
                    key={`session-${workspace_id ?? "own"}-${listed.length}`}
                    id="hook-session"
                    title="Session"
                    label="Session"
                    showLabel
                    disabled={disabled}
                    info="Where each call's run and its result land. A session of its own keeps the chat on screen as it is; it shows under the conversation's sessions."
                    options={session_options.map((it) => ({ ...it, default: it.value == String(session) }))}
                    changeHandler={(value) =>
                        onChange({
                            workspace_id,
                            session: value == "current" || value == "new" ? value : Number(value),
                        })
                    }
                />
            ) : (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">Loading the sessions...</Span>
            )}
            {error ? <Span className="text-[13px] leading-[18px] text-ink-secondary">{error}</Span> : null}
        </>
    );
}
