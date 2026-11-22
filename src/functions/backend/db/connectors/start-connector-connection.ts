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
    bot_id?: number | string;
    session_id?: number | string;
};

type Result = {
    /**
     * Null when the user already has a connected account: there is nothing
     * to sign in to.
     */
    request: ConnectorRequestPayload | null;
    accounts: ConnectorAccountRecord[];
};

/**
 * Starts (or finds) a sign-in for one connector, after reading what the
 * provider already has: a user who connected it before gets no second link.
 * The request outlives the page that made it, so the card under a reply and
 * Settings > Connectors both read it the same way.
 */
export default async function startConnectorConnection({
    user_id,
    connector_id,
    label,
    bot_id,
    session_id,
}: Params): Promise<Result> {
    const connector = await grabConnector({ connector_id });

    if (!connector.enabled) throw new AppError(`${connector.name} is turned off, so it can't be connected right now.`);

    const accounts = await syncConnectorAccounts({ user_id, connector_id: connector.id, label });
    const connected = accounts.filter((account) => account.status == "connected");

    if (connected.length) return { request: null, accounts };

    const request = await createConnectorRequest({
        user_id: Number(user_id),
        connector,
        label,
        bot_id: bot_id ? Number(bot_id) : undefined,
        session_id: session_id ? Number(session_id) : undefined,
    });

    return {
        request: await grabConnectorRequestView({ request_id: request.id, user_id }),
        accounts,
    };
}