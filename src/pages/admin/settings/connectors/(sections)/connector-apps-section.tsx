import { useContext, useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Link from "@moduletrace/twui/layout/Link";
import Pagination from "@moduletrace/twui/elements/Pagination";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ArrowLeft } from "lucide-react";
import { ConnectorAppFilters, type ConnectorAppFilter } from "@/src/dict/connector-dict";
import TabButton from "@/src/components/general/tab-button";
import { AppContext } from "@/src/pages/__root";
import type { ConnectorAppsPagePayload } from "@/src/types";
import SettingsGroup from "../../(partials)/settings-group";
import SettingsList from "../../(partials)/settings-list";
import SettingsShell from "../../(partials)/settings-shell";
import SettingsStatus from "../../(partials)/settings-status";
import useConnectorApps from "../(hooks)/use-connector-apps";
import ConnectorRow from "../(partials)/connector-row";

type Status = { error?: boolean; success?: boolean; msg?: string };

/**
 * One connection's apps, a page at a time. A connection can hold thousands
 * (Composio listed 1,842), so nothing here renders them all: search narrows
 * them, and each row is one app to give to bots or workspaces.
 */
export default function ConnectorAppsSection() {
    const { pageProps } = useContext(AppContext);
    const page = pageProps?.connector_apps_page as
        | ConnectorAppsPagePayload
        | undefined;
    const {
        payload,
        loading,
        error,
        page: current_page,
        filter,
        setPage,
        search,
        selectFilter,
        refresh,
    } = useConnectorApps({
        connection_id: page?.connection.id || 0,
    });
    const [status, setStatus] = useState<Status>();

    if (!page) return null;

    const { connection, targets, my_bots } = page;
    const items = payload?.items || [];
    const total = payload?.total || 0;
    const page_size = payload?.page_size || 24;
    const pages = Math.max(1, Math.ceil(total / page_size));
    const when = payload?.query ? ` matching "${payload.query}"` : "";

    /**
     * The three tabs, with how many apps each holds. A count of zero is
     * left off, so an empty tab reads plainly.
     */
    const tabTitle = (entry: (typeof ConnectorAppFilters)[number]) => {
        const count = payload?.counts[entry.value] ?? 0;

        return count ? `${entry.title} ${count}` : entry.title;
    };

    const changed = async (msg: string) => {
        setStatus({ success: true, msg });
        await refresh();
    };
    const failed = (msg: string) => setStatus({ error: true, msg });

    const accessFor = (connector_id: number) =>
        payload?.access.find((entry) => entry.connector_id == connector_id);

    return (
        <SettingsShell
            title={connection.name}
            description={`The apps ${connection.name} offers. Give one to every bot, to a workspace, or to your own runs on a bot; a workspace uses every account connected for that app, whoever connected it.`}
        >
            <Row className="w-full items-center gap-2!">
                <Link href="/admin/settings/connectors" className="text-sm">
                    <ArrowLeft size={14} aria-hidden className="mr-1 inline" />
                    All connectors
                </Link>
            </Row>
            <SettingsGroup title="Apps">
                <Row role="tablist" aria-label="Which apps" className="w-full gap-1! flex-nowrap mb-2">
                    {ConnectorAppFilters.map((entry) => (
                        <TabButton
                            key={entry.value}
                            title={tabTitle(entry)}
                            active={entry.value == filter}
                            onPick={() => selectFilter(entry.value as ConnectorAppFilter)}
                        />
                    ))}
                </Row>
                <Row className="w-full items-center gap-2!">
                    <Input
                        id="connector-app-search"
                        title="Search apps"
                        placeholder={`Search ${connection.app_count ? `all ${connection.app_count} apps` : "apps"}`}
                        onChange={(e) => search(e.target.value)}
                        className="w-full"
                        autoFocus
                    />
                </Row>
                <Span className="text-xs text-ink-secondary">
                    {loading
                        ? "Reading apps..."
                        : error
                          ? ""
                          : `${total} ${total == 1 ? "app" : "apps"}${when} · page ${current_page} of ${pages}`}
                </Span>
                {error ? (
                    <SettingsStatus status={{ error: true, msg: error }} />
                ) : (
                    <SettingsList
                        is_empty={!loading && !items.length}
                        empty={
                            payload?.query
                                ? "No app matches that."
                                : filter == "connected"
                                  ? "No app here is connected yet: add a connection to one."
                                  : filter == "unconnected"
                                    ? "Every app here has a connection."
                                    : "This connection has no apps yet: sync it above."
                        }
                    >
                        {items.map((connector) => (
                            <ConnectorRow
                                key={connector.id}
                                connector={connector}
                                connection_name={connection.name}
                                accounts={(payload?.accounts || []).filter(
                                    (account) =>
                                        account.connector_id == connector.id,
                                )}
                                access={accessFor(connector.id)}
                                targets={targets}
                                bots={my_bots}
                                onChanged={changed}
                                onError={failed}
                                onNote={(msg: string) =>
                                    setStatus({ success: true, msg })
                                }
                                onRefresh={refresh}
                            />
                        ))}
                    </SettingsList>
                )}
                {total > page_size ? (
                    <Pagination
                        count={total}
                        page={current_page}
                        setPage={setPage}
                        limit={page_size}
                        className="mt-4 w-full justify-center"
                    />
                ) : null}
                <SettingsStatus status={status} />
            </SettingsGroup>
        </SettingsShell>
    );
}
