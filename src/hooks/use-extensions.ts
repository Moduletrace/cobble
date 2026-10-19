import { useState } from "react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { BotExtension, BotExtensionsPayload } from "@/src/types";

type Params = {
    /**
     * Whose they are: a bot's (`workspace_id` is where it's seen, so that
     * workspace's show too) or a workspace's.
     */
    owner: { bot_id: number; workspace_id?: number | null } | { workspace_id: number };
    /**
     * The bot's or workspace's name, for the confirmations.
     */
    owner_name: string;
    initial?: BotExtensionsPayload | null;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * A bot's or workspace's MCP servers and tools, with adding and removing
 * them (each asks first). Shared by the bot and workspace settings pages
 * and the chat's composer.
 */
export default function useExtensions({ owner, owner_name, initial }: Params) {
    const [data, setData] = useState<BotExtensionsPayload>(
        initial || { attached: [], addable: [], can_manage: false },
    );
    const [busy, setBusy] = useState<string>();
    const [status, setStatus] = useState<Status>();
    const api = "bot_id" in owner ? "bots" : "workspaces";

    const change = async ({
        action,
        kind,
        id,
    }: {
        action: "add" | "remove";
        kind: BotExtension["kind"];
        id: number;
    }) => {
        setBusy(`${kind}:${id}`);
        setStatus(undefined);

        const res = await postAdminApi<BotExtensionsPayload>({
            path: `${api}/${action}-extension`,
            body: { ...owner, kind, id },
        });

        setBusy(undefined);

        if (!res.success || !res.singleRes) {
            setStatus({ error: true, msg: res.msg || "That didn't work." });
            return false;
        }

        setData(res.singleRes);
        setStatus({ success: true, msg: res.msg || "Saved." });
        return true;
    };

    const add = async ({ kind, id }: { kind: BotExtension["kind"]; id: number }) => {
        const item = data.addable.find((entry) => entry.kind == kind && entry.id == id);

        if (!window.confirm(`Give ${owner_name} ${item?.name || "this"}?`)) return false;

        return change({ action: "add", kind, id });
    };

    const remove = async ({ kind, id, name }: { kind: BotExtension["kind"]; id: number; name: string }) => {
        if (!window.confirm(`Remove ${name} from ${owner_name}?`)) return false;

        return change({ action: "remove", kind, id });
    };

    return { ...data, busy, status, add, remove };
}
