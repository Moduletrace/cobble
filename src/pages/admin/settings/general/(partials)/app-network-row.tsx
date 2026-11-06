"use client";

import { Network, Trash2 } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";
import RowIconButton from "@/src/components/general/row-icon-button";
import SettingsListRow from "../../(partials)/settings-list-row";

type Props = {
    name: string;
    /**
     * Where the app stands on it, in words.
     */
    subtitle: string;
    /**
     * For networks the app is always on, which can't be removed here.
     */
    badge?: string;
    disabled?: boolean;
    onRemove?: () => void;
};

/**
 * One docker network in the app's list.
 */
export default function AppNetworkRow({ name, subtitle, badge, disabled, onRemove }: Props) {
    return (
        <SettingsListRow avatar={<IconTile Icon={Network} />} title={name} badge={badge} subtitle={subtitle}>
            {onRemove ? (
                <RowIconButton icon={Trash2} title={`Remove ${name}`} disabled={disabled} onClick={onRemove} />
            ) : null}
        </SettingsListRow>
    );
}
