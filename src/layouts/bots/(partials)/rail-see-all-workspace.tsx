import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import type { WorkspaceWithActivity } from "@/src/types";

type Props = {
    workspace: WorkspaceWithActivity;
};

/**
 * One small workspace tile beside "See all workspaces".
 */
export default function RailSeeAllWorkspace({ workspace }: Props) {
    return <WorkspaceAvatar image_media_id={workspace.image_media_id} size="xs" />;
}
