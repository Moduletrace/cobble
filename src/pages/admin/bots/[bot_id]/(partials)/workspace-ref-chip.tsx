import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { CrewWorkspacesContext } from "../(data)/crew-workspaces-context";

type Props = {
    workspace_id: number;
};

/**
 * A workspace named in a message (`workspaceRef`): a link to its
 * dashboard. One the user isn't in is shown by name only.
 */
export default function WorkspaceRefChip({ workspace_id }: Props) {
    const workspaces = useContext(CrewWorkspacesContext);
    const workspace = workspaces.find((w) => w.id == workspace_id);

    if (!workspace) {
        return <Span className="font-bold">{`workspace ${workspace_id}`}</Span>;
    }

    return (
        <Link
            href={`/admin/workspaces/${workspace.id}`}
            title={`Open ${workspace.name}`}
            className="inline-flex h-6 max-w-full gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap hover:opacity-80"
        >
            <WorkspaceAvatar image_media_id={workspace.image_media_id} size="xs" />
            <Span className="min-w-0 truncate">{workspace.name}</Span>
        </Link>
    );
}
