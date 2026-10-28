import { useContext, useEffect, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import Input from "@moduletrace/twui/form/Input";
import Link from "@moduletrace/twui/layout/Link";
import { FolderOpen } from "lucide-react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import type { BotWithLastMessage } from "@/src/types";
import HeaderIconButton from "@/src/components/general/header-icon-button";
import { AppContext } from "@/src/pages/__root";
import useDebouncedValue from "@/src/hooks/use-debounced-value";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";
import useBotFiles from "../(hooks)/use-bot-files";
import FileRow from "./file-row";
import HeaderMenuItem from "./header-menu-item";

type Props = {
    bot: BotWithLastMessage;
    workspace?: BUN_SQLITE_COBBLE_WORKSPACES | null;
    /**
     * A row in the conversation header's menu instead of an icon beside it.
     */
    menu?: boolean;
    on_open?: () => void;
};

/**
 * The files a conversation works with: a bot's own folder, or the
 * workspace's shared one. Each can be opened or deleted (a crew manager
 * only). The list loads when the modal opens, and search (by name or path,
 * as the user types) goes through the same endpoint, so the page props
 * stay small.
 */
export default function BotFilesModal({ bot, workspace, menu, on_open }: Props) {
    const { pageProps } = useContext(AppContext);
    const [open, setOpen] = useState(false);
    const [search, setSearch] = useState("");
    const query = useDebouncedValue({ value: search.trim() });
    const [busy_id, setBusyId] = useState<number>();
    const [status, setStatus] = useState<string>();
    const { data, loading, error, reload } = useBotFiles({
        bot_id: Number(bot.id),
        workspace_id: workspace?.id ? Number(workspace.id) : null,
        enabled: open,
        search: query,
    });

    const can_manage = canManageCrew({ user_types: pageProps?.user_types });
    const name = bot.name || "This bot";
    const title = workspace?.id ? `${workspace.name || "Workspace"} files` : `${name}'s files`;

    useEffect(() => {
        if (open) on_open?.();
    }, [open]);

    const run = async ({
        url,
        payload,
        file_id,
        done,
    }: {
        url: string;
        payload: Record<string, unknown>;
        file_id: number;
        done: string;
    }) => {
        setBusyId(file_id);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject>(url, {
            method: "POST",
            body: payload,
        }).catch(() => null);

        setBusyId(undefined);
        setStatus(res?.success ? done : res?.msg || `That didn't work.`);

        if (res?.success) await reload({ search: query });
    };

    const files = data?.files || [];
    const usage = data?.usage;

    return (
        <Modal
            target={
                menu ? (
                    <HeaderMenuItem
                        icon={FolderOpen}
                        title="Files"
                        description={title}
                        loading={loading}
                    />
                ) : (
                    <HeaderIconButton icon={FolderOpen} title={title} loading={loading} />
                )
            }
            targetWrapperProps={{ className: menu ? "w-full" : "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-xl bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">{title}</H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {workspace?.id
                        ? `Files every bot here can find and read. They're kept with the app, not on a computer.`
                        : `What ${name} has saved: documents you sent, files it wrote and images it made. They're kept with the app, not on a computer.${can_manage ? " Deleting one removes it for good." : ""}`}
                </Span>
                {usage ? (
                    <Span className="text-[12px] leading-4 text-ink-secondary">
                        {`${usage.files} file(s), ${(usage.bytes / (1024 * 1024)).toFixed(1)} MB of ${
                            data?.quota_mb || 0
                        } MB used in this folder.`}
                    </Span>
                ) : null}
                <Link
                    href={`/admin/files?volume=${workspace?.id ? "workspaces" : "bots"}&owner=${
                        workspace?.id || bot.id
                    }`}
                    title="Browse every folder in Files"
                    className="text-[12px] font-bold leading-4 text-ink underline underline-offset-2 hover:opacity-80"
                >
                    Browse this folder in Files
                </Link>
            </Stack>

            <Stack className="w-full mt-4 gap-2! items-stretch">
                <Input
                    placeholder="Search by name or path"
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    clearInputProps={{ onClick: () => setSearch("") }}
                />
            </Stack>

            <Stack className="w-full mt-2 gap-0! items-stretch overflow-y-auto max-h-[50vh]">
                {files.length ? (
                    files.map((file) => (
                        <FileRow
                            key={file.id}
                            file={file}
                            can_manage={can_manage}
                            busy={busy_id == file.id}
                            onDelete={() =>
                                run({
                                    url: `/api/admin/bots/delete-file`,
                                    payload: { file_id: file.id },
                                    file_id: file.id,
                                    done: `${file.name} is deleted.`,
                                })
                            }
                        />
                    ))
                ) : (
                    <Span className="py-6 text-[13px] leading-[18px] text-ink-secondary">
                        {loading
                            ? "Loading files..."
                            : error || (query ? `Nothing matches "${query}".` : "No files yet.")}
                    </Span>
                )}
            </Stack>

            {status ? (
                <Span role="status" className="mt-3 text-[13px] leading-[18px] text-ink-secondary">
                    {status}
                </Span>
            ) : null}
        </Modal>
    );
}
