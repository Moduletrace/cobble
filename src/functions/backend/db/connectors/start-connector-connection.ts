import type { ConnectorAccountRecord, ConnectorRequestPayload } from "@/src/types";
import AppError from "@/src/utils/app-error";
import createConnectorRequest from "./create-connector-request";
import grabConnector from "./grab-connector";
import grabConnectorRequestView from "./grab-connector-request-view";
import syncConnectorAccounts from "./sync-connector-accounts";

type Params = {
    user_id: number | string;
    connector_id: number | string;
    /**
     * What the user calls the account they're connecting, e.g. Work Gmail.
     */
    label?: string;
    /**
     * The account this sign-in reconnects, when one went dead. Its row is
     * updated in place once the provider lists the new sign-in, so it keeps
     * its label and its tool namespace.
     */
    account_id?: number | string;
    bot_id?: number | string;
    session_id?: number | string;
};

type Result = {
    /**
     * The sign-in link. Always made: a person can keep several accounts on
     * one app (a work Gmail beside a personal one), so an account already
     * connected never stands in for the new one.
     */
    request: ConnectorRequestPayload | null;
    accounts: ConnectorAccountRecord[];
};

/**
 * Starts a sign-in for one connector. The request outlives the page that
 * made it, so the card under a reply and Settings > Connectors both read it
 * the same way.
 */
export default async function startConnectorConnection({
    user_id,
    connector_id,
    label,
    account_id,
    bot_id,
    session_id,
}: Params): Promise<Result> {
    const connector = await grabConnector({ connector_id });

    if (!connector.enabled) throw new AppError(`${connector.name} is turned off, so it can't be connected right now.`);

    const accounts = await syncConnectorAccounts({ user_id, connector_id: connector.id, label });

    const request = await createConnectorRequest({
        user_id: Number(user_id),
        connector,
        label,
        account_id: account_id ? Number(account_id) : undefined,
        bot_id: bot_id ? Number(bot_id) : undefined,
        session_id: session_id ? Number(session_id) : undefined,
    });

    return {
        request: await grabConnectorRequestView({ request_id: request.id, user_id }),
        accounts,
    };
}