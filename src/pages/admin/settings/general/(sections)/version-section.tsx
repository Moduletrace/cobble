import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import SettingsGroup from "../../(partials)/settings-group";
import VersionLine from "../(partials)/version-line";

/**
 * What this server is running, so an update can be confirmed from the app
 * instead of the installer's output.
 */
export default function VersionSection() {
    const { pageProps } = useContext(AppContext);

    return (
        <SettingsGroup
            title="Version"
            description="The release this server runs, so an update can be confirmed from the app."
            id="version"
        >
            <VersionLine running={pageProps?.running_version} />
        </SettingsGroup>
    );
}
