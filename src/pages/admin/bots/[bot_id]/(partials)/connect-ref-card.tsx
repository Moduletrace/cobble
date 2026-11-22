import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Cable, CircleCheck, ExternalLink, RefreshCw } from "lucide-react";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { ConnectorRequestPayload } from "@/src/types";
import useConnectRequest from "../(hooks)/use-connect-request";
import RefCardShell from "./ref-card-shell";

type Props = {
    request_id: number;
};

const StatusLabels = {
    pending: "Waiting for you",
    connected: "Connected",
    expired: "Expired",
    cancelled: "Cancelled",
} as const;

/**
 * A connector the bot needs an account for, as the card the user acts on:
 * the provider's own sign-in opened from here, then read again until it
 * says the account is in. What is connected is the viewer's alone.
 */
export default function ConnectRefCard({ request_id }: Props) {
    const { view, setView, loading } = useConnectRequest({ request_id });

    if (!view) {
        return (
            <Span className="font-bold">
                {loading ? `connect ${request_id}` : `connect ${request_id} (not available)`}
            </Span>
        );
    }

    const pending = view.status == "pending";
    const connected = view.status == "connected";

    const recheck = async () => {
        const res = await postAdminApi<ConnectorRequestPayload>({
            path: "connectors/connection-status",
            body: { request_id },
        });

        if (res.singleRes) setView(res.singleRes);
    };

    return (
        <RefCardShell
            icon={<Cable size={14} aria-hidden />}
            title={view.connector_name}
            status={StatusLabels[view.status]}
            tone={connected ? "success" : pending ? "warning" : "gray"}
            description={
                connected
                    ? `Your ${view.label || "account"} is connected. Its tools are ready for your next message.`
                    : pending
                      ? "Its sign-in happens at the provider, which keeps the account. Nothing here sees it."
                      : view.status == "expired"
                        ? "The link expired before the sign-in finished. Ask the bot to send a new one."
                        : "This connect request was cancelled."
            }
        >
            {pending ? (
                <Row className="flex-wrap items-center gap-2!">
                    <Button
                        title={`Open the sign-in for ${view.connector_name}`}
                        type="button"
                        size="small"
                        className="gap-1!"
                        href={view.url}
                        linkProps={{ target: "_blank", rel: "noopener noreferrer" }}
                    >
                        <ExternalLink size={14} aria-hidden />
                        Open sign-in
                    </Button>
                    <Button
                        title="Check whether the sign-in finished"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        className="gap-1!"
                        onClick={recheck}
                    >
                        <RefreshCw size={14} aria-hidden />
                        Check again
                    </Button>
                </Row>
            ) : connected ? (
                <Row className="items-center gap-1.5!">
                    <CircleCheck size={14} aria-hidden />
                    <Span className="text-[13px] leading-[18px] text-ink">Connected as {view.label}.</Span>
                </Row>
            ) : null}
        </RefCardShell>
    );
}