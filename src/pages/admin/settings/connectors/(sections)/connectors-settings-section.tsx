import { useContext, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import { Plus } from "lucide-react";
import { AppContext } from "@/src/pages/__root";
import type { ConnectorConnectionRecord, ConnectorsPagePayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsStatus from "../../(partials)/settings-status";
import readConnectorConnections from "../(functions)/read-connector-connections";
import ConnectorConnectionModal from "../(partials)/connector-connection-modal";
import ConnectorConnectionRow from "../(partials)/connector-connection-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * The install's provider connections, each with its own key. Their apps are
 * far too many to list here (one connection listed 1,842), so each row
 * opens a page of its own: search there, and give an app to bots,
 * workspaces or your own runs.
 */
export default function ConnectorsSettingsSection() {
    const { pageProps } = useContext(AppContext);
    const page = pageProps?.connectors_page as ConnectorsPagePayload | undefined;
    const [connections, setConnections] = useState<ConnectorConnectionRecord[]>(page?.connections || []);
    const [adding, setAdding] = useState(false);
    const [status, setStatus] = useState<Status>();

    if (!page) return null;

    const targets = page.targets;

    const refresh = async () => {
        const res = await readConnectorConnections();

        if (res.success && res.singleRes) setConnections(res.singleRes.connections);
        else setStatus({ error: true, msg: res.msg || "Couldn't read the connectors again." });
    };

    const changed = async (msg: string) => {
        setStatus({ success: true, msg });
        await refresh();
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    return (
        <SettingsGroup
            title="Connectors"
            description="Connect a paradigm once and every app it offers is listed under it. Open a connection to search its apps and give one to every bot, to a workspace, or to your own runs on a bot; a workspace uses every account connected for that app, whoever connected it."
        >
            <SettingsList is_empty={!connections.length} empty="No connectors yet">
                {connections.map((connection) => (
                    <ConnectorConnectionRow
                        key={connection.id}
                        connection={connection}
                        can_edit={targets.can_edit}
                        onChanged={changed}
                        onError={failed}
                    />
                ))}
            </SettingsList>
            {targets.can_edit ? (
                <Row className="w-full items-center">
                    <Button
                        title="Add a connection"
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        onClick={() => setAdding(true)}
                    >
                        <Plus size={14} aria-hidden />
                        Add connection
                    </Button>
                </Row>
            ) : null}
            <SettingsStatus status={status} />
            {adding ? (
                <ConnectorConnectionModal
                    onSaved={async (msg) => {
                        setAdding(false);
                        await changed(msg);
                    }}
                    onCancel={() => setAdding(false)}
                />
            ) : null}
        </SettingsGroup>
    );
}