import { useState } from "react";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import ImagePickField from "@/src/components/general/image-pick-field";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import setProfileImage from "@/src/functions/frontend/set-profile-image";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import SettingsStatus from "@/src/pages/admin/settings/(partials)/settings-status";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
};

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The workspace's picture, shown in the rail. Saved as soon as it's
 * picked or removed.
 */
export default function WorkspaceImageGroup({ workspace }: Props) {
    const [image_media_id, setImageMediaId] = useState(workspace.image_media_id || null);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<Status>();

    const save = async ({ data_url }: { data_url: string | null }) => {
        setLoading(true);
        setStatus(undefined);

        const res = await setProfileImage({
            target: "workspace",
            id: Number(workspace.id),
            data_url,
        }).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || "Couldn't save the picture." });
            return;
        }

        setImageMediaId(res.singleRes.image_media_id);
        setStatus({ success: true, msg: res.msg || "Saved." });
    };

    return (
        <SettingsGroup id="picture" title="Picture" description="Shown beside the workspace's name in the rail.">
            <ImagePickField
                preview={<WorkspaceAvatar size="lg" image_media_id={image_media_id} />}
                has_image={Boolean(image_media_id)}
                onPick={({ data_url }) => save({ data_url })}
                onRemove={() => save({ data_url: null })}
                loading={loading}
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
