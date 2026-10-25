import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import InstallIconForm from "../(partials)/install-icon-form";

/**
 * The icon this install goes by once installed as an app, beside its name.
 * Super admin only.
 */
export default function InstallIconSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="App icon"
            description="The icon this install shows on home screens, app lists and notifications. A device that already installed the app keeps the old icon until it's installed again."
            id="install-icon"
        >
            <InstallIconForm install_icon={pageProps?.install_icon} />
        </SettingsGroup>
    );
}
