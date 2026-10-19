import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { twMerge } from "tailwind-merge";
import type { WorkspaceWithActivity } from "@/src/types";

type Props = {
    workspace: WorkspaceWithActivity;
    selected?: boolean;
};

/**
 * A workspace in the rail, the same 48px row as a bot. Workspaces have no
 * hue, so unread is said in words beside the description.
 */
export default function WorkspaceRow({ workspace, selected }: Props) {
    return (
        <Link
            href={`/admin/workspaces/${workspace.id}`}
            aria-current={selected ? "page" : undefined}
            title={workspace.name}
            className={twMerge(
                "flex shrink-0 h-12 items-center gap-3 rounded-default px-1 @rail:px-3 border-0 leading-normal text-ink",
                "hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)]",
                "focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
                selected && "bg-ink/5 hover:bg-ink/5",
            )}
        >
            <WorkspaceAvatar image_media_id={workspace.image_media_id} className="mx-auto @rail:mx-0" />
            <Stack className="hidden @rail:flex grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{workspace.name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {workspace.unread ? "New messages" : workspace.description || ""}
                </Span>
            </Stack>
        </Link>
    );
}
