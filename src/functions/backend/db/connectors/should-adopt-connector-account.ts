import type { ProviderAccountStatus } from "@/src/harness/connectors/connector-provider";

type Params = {
    status: ProviderAccountStatus;
    /** A pending request is reconnecting this very account. */
    reconnect: boolean;
    /** A pending request here started this sign-in. */
    claimed: boolean;
};

/**
 * Whether a provider account becomes a local row: only one a request here
 * started or is reconnecting, and only once it is connected. One card per
 * sign-in, so an account the provider already held (a leftover from an earlier
 * attempt, or a sign-in made at the provider itself) never arrives as a second
 * card of the same mailbox. A sign-in that hasn't finished has no card either:
 * a link that connects under another id would leave a dead row beside the real
 * one.
 */
export default function shouldAdoptConnectorAccount({ status, reconnect, claimed }: Params) {
    return status == "connected" && (reconnect || claimed);
}