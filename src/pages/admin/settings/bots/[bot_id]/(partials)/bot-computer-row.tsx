import type { ComputerWithStatus } from "@/src/types";
import ComputerListRow from "../../../(partials)/computer-list-row";
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
        <ComputerListRow computer={computer}>
            {onRemove ? (
                <SettingsRowAction
                    title={`Take ${name}'s access away`}
                    label="Remove"
                    disabled={busy}
                    onClick={onRemove}
                />
            ) : null}
        </ComputerListRow>
    );
}
