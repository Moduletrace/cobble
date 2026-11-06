import { useContext } from "react";
import { AppContext } from "@/src/pages/__root";
import isPassThroughUser from "@/src/utils/rbac/is-pass-through-user";
import SettingsGroup from "../../(partials)/settings-group";
import AppNetworksForm from "../(partials)/app-networks-form";

/**
 * The extra docker networks the app's own container joins, e.g. a
 * tunnel's or a database's. Only the super admin sees it.
 */
export default function AppNetworksSection() {
    const { pageProps } = useContext(AppContext);

    if (!isPassThroughUser({ user_types: pageProps?.user_types })) return null;

    return (
        <SettingsGroup
            title="Docker networks"
            description="Docker networks the app's own container joins, e.g. a tunnel's or a database's. Kept across updates; computers don't join them."
            id="docker-networks"
        >
            <AppNetworksForm />
        </SettingsGroup>
    );
}
