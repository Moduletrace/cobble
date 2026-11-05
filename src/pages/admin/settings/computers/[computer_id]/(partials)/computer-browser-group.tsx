import { useState } from "react";
import type { ComputerWithStatus } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";
import SettingsStatus from "../../../(partials)/settings-status";
import ComputerBrowserForm from "./computer-browser-form";

type Props = {
    computer: ComputerWithStatus;
    onUpdated: (computer: ComputerWithStatus) => void;
};

/**
 * The computer's browser: who it looks like to sites (timezone, languages,
 * screen) and how it runs (sandbox, extra flags). Saving restarts it with
 * them; its files and logins stay.
 */
export default function ComputerBrowserGroup({ computer, onUpdated }: Props) {
    const [status, setStatus] = useState<{ success?: boolean; msg?: string }>();

    return (
        <SettingsGroup
            id="browser"
            title="Browser"
            description="Keep the timezone and languages matched to where its traffic comes from: a mismatch is what sites notice. Saving restarts it; its files and logins stay."
        >
            <ComputerBrowserForm
                key={computer.browser_settings || "defaults"}
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
