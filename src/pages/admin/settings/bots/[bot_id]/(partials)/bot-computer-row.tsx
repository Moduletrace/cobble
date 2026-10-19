import ComputerIconTile from "@/src/components/general/computer-icon-tile";
import type { ComputerWithStatus } from "@/src/types";
import computerResourcesLabel from "@/src/utils/computer-resources-label";
import computerStatusLabel from "@/src/utils/computer-status-label";
import SettingsListRow from "../../../(partials)/settings-list-row";
import SettingsRowAction from "../../../(partials)/settings-row-action";

type Props = {
    computer: ComputerWithStatus;
    busy?: boolean;
    onRemove?: () => void;
};

/**
 * One computer the bot can use in its own chat.
 */
export default function BotComputerRow({
    computer,
    busy,
    onRemove,
}: Props) {
    const name = computer.name || `Computer ${computer.id}`;

    return (
        <SettingsListRow
            avatar={<ComputerIconTile />}
            title={name}
            subtitle={[
                computerStatusLabel({ computer }),
                computerResourcesLabel({ computer }),
                computer.description,
            ]
                .filter(Boolean)
                .join(" · ")}
        >
            {onRemove ? (
                <SettingsRowAction
                    title={`Take ${name}'s access away`}
                    label="Remove"
                    disabled={busy}
                    onClick={onRemove}
                />
            ) : null}
        </SettingsListRow>
    );
}
