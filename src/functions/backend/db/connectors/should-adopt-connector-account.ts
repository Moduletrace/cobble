import type { ProviderAccountStatus } from "@/src/harness/connectors/connector-provider";

type Params = {
    status: ProviderAccountStatus;
    /** A pending request is reconnecting this very account. */
    reconnect: boolean;
    /** A pending request here started this sign-in. */
    claimed: boolean;
};

/**
 * Whether a provider account becomes a local row. A connected one always does.
 * A pending one does only when a request here started it or reconnects it: an
 * abandoned sign-in at the provider must not arrive as a second account, which
 * is how a reconnect once left a never connected duplicate beside the account
 * it replaced.
 */
export default function shouldAdoptConnectorAccount({ status, reconnect, claimed }: Params) {
    return reconnect || status == "connected" || claimed;
}