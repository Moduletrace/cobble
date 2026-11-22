type Params = {
    connector_name: string;
    label: string;
    provider_title: string;
};

/**
 * A row can outlive the account it names: a sign-in is deleted at the
 * provider (a second one replaced it, a connection was cleared there) while
 * the local row still says connected. Pinning that id would make the provider
 * fall back to whatever account it does have, so the run would answer from a
 * mailbox nobody chose. The tool refuses instead, naming the fix.
 */
export default function connectorAccountGoneMessage({ connector_name, label, provider_title }: Params) {
    return `The ${connector_name} account "${label}" no longer exists at ${provider_title}, so this didn't run. Reconnect it in Settings > Connectors.`;
}