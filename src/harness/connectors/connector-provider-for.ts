import AppError from "@/src/utils/app-error";
import { decrypt } from "@/src/utils/crypt";
import { ConnectorProviders } from "@/src/dict/connector-dict";
import type { ConnectorProvider } from "./connector-provider";
import composioConnectorProvider from "./providers/composio";

type Params = {
    /**
     * The `connector_connections` row the provider is built for: its id,
     * provider, shown name and encrypted key. One provider can be connected
     * several times (Composio Personal, Composio Work), each with its own
     * key, so the connection, not the provider, decides which account's
     * catalog and sign-ins are used.
     */
    connection: {
        provider: string;
        name: string;
        api_key: string;
    };
};

/**
 * The adapter for one connection, with its own key decrypted here and
 * nowhere else. A missing key is a sentence a tool result or the settings
 * page can show, never a silent no-op.
 */
export default async function connectorProviderFor({ connection }: Params): Promise<ConnectorProvider> {
    const preset = ConnectorProviders.find((entry) => entry.value == connection.provider);

    if (!preset) throw new AppError(`This install has no connector provider called "${connection.provider}".`);

    const key = connection.api_key ? (await decrypt(connection.api_key)).trim() : "";

    if (!key) {
        throw new AppError(
            `The ${preset.title} connection "${connection.name}" has no key yet, so its apps can't be used. A super admin can add one in Settings > Connectors.`,
        );
    }

    if (preset.value == "composio") return composioConnectorProvider({ key, base_url: preset.base_url });

    throw new AppError(`${preset.title} isn't available in this version.`);
}