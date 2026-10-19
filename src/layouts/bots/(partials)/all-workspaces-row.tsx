import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { WorkspaceWithActivity } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    workspace: WorkspaceWithActivity;
};

/**
 * One workspace in the all-workspaces modal: tile, name, description, last
 * activity.
 */
export default function AllWorkspacesRow({ workspace }: Props) {
    return (
        <Link
            href={`/admin/workspaces/${workspace.id}`}
            title={workspace.name}
            className="flex h-14 items-center gap-3 rounded-default px-3 border-0 leading-normal hover:opacity-100 hover:bg-sunken transition-colors duration-[var(--m-fast)] focus-visible:ring-2 focus-visible:ring-ink"
        >
            <WorkspaceAvatar image_media_id={workspace.image_media_id} />
            <Stack className="grow min-w-0 gap-0!">
                <Span className="text-sm font-bold leading-5 text-ink truncate w-full">{workspace.name}</Span>
                <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                    {workspace.unread ? "New messages" : workspace.description || ""}
                </Span>
            </Stack>
            {workspace.last_activity_at ? (
                <Span className="shrink-0 text-[11px] leading-4 text-ink-secondary">
                    {relativeTime({ at: Number(workspace.last_activity_at) })}
                </Span>
            ) : null}
        </Link>
    );
}
