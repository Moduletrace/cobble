"use client";

import { useEffect, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Loading from "@moduletrace/twui/elements/Loading";
import Form from "@moduletrace/twui/form/Form";
import Select from "@moduletrace/twui/form/Select";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { AppNetworksOverview } from "@/src/types";
import checkAppNetworks from "@/src/utils/check-app-networks";
import SettingsList from "../../(partials)/settings-list";
import SettingsSaveBar from "../../(partials)/settings-save-bar";
import AppNetworkFixedItem from "./app-network-fixed-item";
import AppNetworkListItem from "./app-network-list-item";

const Endpoint = "/api/admin/settings/app-networks";

/**
 * The extra docker networks the app's container joins. Loaded when the
 * section shows (it asks docker), edited as a list, saved as a whole
 * without a reload.
 */
export default function AppNetworksForm() {
    const [overview, setOverview] = useState<AppNetworksOverview>();
    const [names, setNames] = useState<string[]>([]);
    const [draft, setDraft] = useState("");
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const saved = overview?.networks.map((network) => network.name) || [];
    const choices = (overview?.available_networks || []).filter((name) => !names.includes(name));
    const full = names.length >= (overview?.max || 0);
    const dirty = names.join("\n") != saved.join("\n");

    const take = (next: AppNetworksOverview) => {
        setOverview(next);
        setNames(next.networks.map((network) => network.name));
    };

    useEffect(() => {
        fetchApi<{}, APIResponseObject<AppNetworksOverview>>(Endpoint, { method: "GET" })
            .then((res) => {
                if (res?.success && res.singleRes) {
                    take(res.singleRes);
                } else {
                    setStatus({ error: true, msg: res?.msg || `Couldn't read the app's networks.` });
                }
            })
            .catch(() => setStatus({ error: true, msg: `Couldn't read the app's networks.` }));
    }, []);

    const add = () => {
        const checked = checkAppNetworks({ networks: [...names, draft] });

        if (checked.error !== undefined) {
            setStatus({ error: true, msg: checked.error });
            return;
        }

        setNames(checked.networks);
        setDraft("");
        setStatus(undefined);
    };

    const remove = ({ name }: { name: string }) => {
        setNames(names.filter((existing) => existing != name));
        setStatus(undefined);
    };

    const save = async () => {
        if (!window.confirm("Save the app's docker networks? It joins the new ones and leaves the removed ones now.")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<AppNetworksOverview>>(Endpoint, {
            method: "POST",
            body: { networks: names },
        }).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({ error: true, msg: res?.msg || `Couldn't save the networks.` });
            return;
        }

        take(res.singleRes);

        const unjoined = res.singleRes.networks.filter((network) => network.status != "connected").length;

        setStatus({
            success: true,
            msg: !res.singleRes.in_docker
                ? `Saved. The app joins them when it runs in docker.`
                : unjoined
                  ? `Saved, but ${unjoined} couldn't be joined yet. See the list.`
                  : `Saved.`,
        });
    };

    const discard = () => {
        setNames(saved);
        setDraft("");
        setStatus(undefined);
    };

    if (!overview) {
        return status?.msg ? (
            <Span className="text-[13px] leading-[18px] text-ink-secondary">{status.msg}</Span>
        ) : (
            <Row className="w-full justify-center py-4">
                <Loading />
            </Row>
        );
    }

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            {!overview.in_docker ? (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    This server isn't running in docker, so the list is only kept for now.
                </Span>
            ) : null}
            <SettingsList is_empty={!names.length && !overview.other_networks.length} empty="No extra networks yet.">
                {names.map((name) => (
                    <AppNetworkListItem
                        key={name}
                        name={name}
                        network={overview.networks.find((network) => network.name == name)}
                        disabled={loading}
                        onRemove={remove}
                    />
                ))}
                {overview.other_networks.map((name) => (
                    <AppNetworkFixedItem key={name} name={name} />
                ))}
            </SettingsList>
            <Stack className="w-full gap-1! items-stretch">
                <Row className="w-full gap-2! flex-nowrap items-end">
                    <Select
                        id="app-network-name"
                        title="Network"
                        label="Network"
                        showLabel
                        value={draft}
                        disabled={loading || full || !choices.length}
                        options={[
                            {
                                value: "",
                                title: choices.length ? "Pick a network" : "No other networks on this machine",
                            },
                            ...choices.map((name) => ({ value: name, title: name })),
                        ]}
                        changeHandler={(value) => {
                            setDraft(String(value));
                            setStatus(undefined);
                        }}
                    />
                    <Button
                        type="button"
                        variant="outlined"
                        color="gray"
                        size="small"
                        title="Add network"
                        disabled={loading || full || !draft}
                        onClick={add}
                    >
                        Add
                    </Button>
                </Row>
                <Span className="text-xs leading-4 text-ink-secondary">
                    {`Every network on this machine the app isn't on yet. Make a new one with docker network create, then reload. Up to ${overview.max}.`}
                </Span>
            </Stack>
            <SettingsSaveBar dirty={dirty} loading={loading} status={status} save_label="Save" onDiscard={discard} />
        </Form>
    );
}
