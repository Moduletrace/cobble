import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { twMerge } from "tailwind-merge";
import { AppContext } from "@/src/pages/__root";
import type { WorkspaceWithActivity } from "@/src/types";
import canManageCrew from "@/src/utils/rbac/can-manage-crew";

type Props = {
    workspace: WorkspaceWithActivity;
    selected?: boolean;
};

/**
 * A workspace in the rail, the same 48px row as a bot. Workspaces have no
 * hue, so unread is said in words beside the description.
 */
export default function WorkspaceRow({ workspace, selected }: Props) {
    const { pageProps } = useContext(AppContext);
    const href = canManageCrew({ user_types: pageProps?.user_types })
        ? `/admin/settings/workspaces/${workspace.id}`
        : `/admin/workspaces/${workspace.id}`;

    return (
        <Link
            href={href}
            aria-current={selected ? "page" : undefined}
            title={workspace.name}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 lg:px-3 border-0 leading-normal text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <WorkspaceAvatar image_media_id={workspace.image_media_id} className="mx-auto lg:mx-0" />
            <Stack className="hidden lg:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{workspace.name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {workspace.unread ? "New messages" : workspace.description || ""}
                </Span>
            </Stack>
        </Link>
    );
}
