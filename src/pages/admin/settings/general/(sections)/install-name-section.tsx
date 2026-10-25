import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import InstallNameForm from "../(partials)/install-name-form";

/**
 * What this install is called once installed as an app, so installs for
 * different teams can sit side by side on one device. Super admin only.
 */
export default function InstallNameSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="App name"
            description="The name this install goes by when it's added to a home screen or app list."
            id="install-name"
        >
            <InstallNameForm install_name={pageProps?.install_name} />
        </SettingsGroup>
    );
}
