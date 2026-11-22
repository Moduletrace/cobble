import type { ProviderAccountStatus } from "@/src/harness/connectors/connector-provider";

type Params = {
    status: ProviderAccountStatus;
    /** A pending request is reconnecting this very account. */
    reconnect: boolean;
    /** A pending request here started this sign-in. */
    claimed: boolean;
    /**
     * Whether the app has no live account here yet: one card per app is
     * filled by the provider's account, and any other account arrives through
     * its own sign-in (claimed).
     */
    free_slot: boolean;
};

/**
 * Whether a provider account becomes a local row. One a request here started
 * (or is reconnecting) always does. A connected one the app doesn't know
 * gets the app's one free card, so leftovers from earlier sign-ins at the
 * provider can't pile up as four rows of the same mailbox; a second account
 * appears by signing in again, which claims its own row.
 */
export default function shouldAdoptConnectorAccount({ status, reconnect, claimed, free_slot }: Params) {
    if (reconnect || claimed) return true;

    return status == "connected" && free_slot;
}