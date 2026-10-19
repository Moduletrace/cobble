import { useState } from "react";
import type { ComputerWithStatus } from "@/src/types";
import AddComputerForm from "@/src/layouts/bots/(partials)/add-computer-form";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";

type Props = {
    computer: ComputerWithStatus;
    onUpdated: (computer: ComputerWithStatus) => void;
};

/**
 * The computer's name, what it's for, and its CPUs and memory, edited in
 * place. New resources restart it; its files stay.
 */
export default function ComputerDetailsGroup({
    computer,
    onUpdated,
}: Props) {
    const [status, setStatus] = useState<{ success?: boolean; msg?: string }>();

    return (
        <SettingsGroup
            id="details"
            title="Details"
            description="New CPUs or memory restart it with them. Its files stay."
        >
            <AddComputerForm
                computer={computer}
                onUpdated={({ computer: saved, msg }) => {
                    onUpdated(saved);
                    setStatus({ success: true, msg });
                }}
            />
            <SettingsStatus status={status} />
        </SettingsGroup>
    );
}
