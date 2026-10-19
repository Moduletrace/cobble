"use client";

import { Smartphone } from "lucide-react";
import type { PushDeviceOverview } from "@/src/types";
import IconTile from "@/src/components/general/icon-tile";
import relativeTime from "@/src/utils/relative-time";
import SettingsListRow from "../../(partials)/settings-list-row";
import SettingsRowAction from "../../(partials)/settings-row-action";

type Props = {
    subscription: PushDeviceOverview;
    removing: boolean;
    onRemove: () => void;
};

/**
 * One device in the Notifications list.
 */
export default function NotificationDeviceRow({
    subscription,
    removing,
    onRemove,
}: Props) {
    const last_used = subscription.last_used_at
        ? `Last used ${relativeTime({ at: subscription.last_used_at })} ago`
        : "Not used yet";

    return (
        <SettingsListRow
            avatar={<IconTile Icon={Smartphone} />}
            title={subscription.device}
            subtitle={
                subscription.last_error
                    ? `Last send failed: ${subscription.last_error}`
                    : `Added ${relativeTime({ at: subscription.created_at })} ago · ${last_used}`
            }
        >
            <SettingsRowAction
                title={`Remove ${subscription.device}`}
                label={removing ? "Removing" : "Remove"}
                disabled={removing}
                onClick={onRemove}
            />
        </SettingsListRow>
    );
}
