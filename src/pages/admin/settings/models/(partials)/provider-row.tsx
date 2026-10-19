import { useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Pencil, RefreshCw, Trash2 } from "lucide-react";
import grabProviderPreset from "@/src/harness/providers/grab-provider-preset";
import type { HarnessOverviewPayload, PublicHarnessProvider } from "@/src/types";
import postHarnessApi from "../(functions)/post-harness-api";
import ProviderForm from "./provider-form";
import ProviderStatus from "./provider-status";

type Props = {
    provider: PublicHarnessProvider;
    onChanged: (overview: HarnessOverviewPayload, msg: string) => void;
    onError: (msg: string) => void;
};

/**
 * One provider: name, key and sync status, and its actions. Edit opens the
 * form in place.
 */
export default function ProviderRow({ provider, onChanged, onError }: Props) {
    const [editing, setEditing] = useState(false);
    const [busy, setBusy] = useState<"sync" | "delete">();

    const act = async (action: "sync" | "delete") => {
        if (busy) return;

        if (
            action == "delete" &&
            !window.confirm(`Remove ${provider.name}? Harnesses set to its models go back to automatic.`)
        ) {
            return;
        }

        setBusy(action);

        const res = await postHarnessApi({
            path: action == "sync" ? "sync-provider" : "delete-provider",
            body: { provider_id: provider.id },
        });

        setBusy(undefined);

        if (res.singleRes) {
            onChanged(res.singleRes, res.msg || "Done.");
        }

        if (!res.success) {
            onError(res.msg || "That didn't work.");
        }
    };

    if (editing) {
        return (
            <Stack className="w-full gap-0! items-stretch py-4 border-0 border-b border-solid border-hairline last:border-b-0">
                <ProviderForm
                    provider={provider}
                    onSaved={(overview, msg) => {
                        setEditing(false);
                        onChanged(overview, msg);
                    }}
                    onCancel={() => setEditing(false)}
                />
            </Stack>
        );
    }

    return (
        <Row className="w-full gap-3! flex-nowrap items-start justify-between py-3 border-0 border-b border-solid border-hairline last:border-b-0">
            <Stack className="gap-0.5! min-w-0">
                <Span className="text-sm font-bold leading-5 text-ink truncate">
                    {provider.name}
                    {provider.name != grabProviderPreset({ kind: provider.kind }).title ? (
                        <Span className="font-normal text-ink-secondary">
                            {" "}
                            ({grabProviderPreset({ kind: provider.kind }).title})
                        </Span>
                    ) : null}
                </Span>
                <ProviderStatus provider={provider} />
            </Stack>
            <Row className="gap-1! flex-nowrap shrink-0">
                <Button
                    title={`Sync ${provider.name} models now`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    loading={busy == "sync"}
                    disabled={Boolean(busy) || !provider.enabled}
                    onClick={() => act("sync")}
                >
                    <RefreshCw size={16} aria-hidden />
                </Button>
                <Button
                    title={`Edit ${provider.name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    disabled={Boolean(busy)}
                    onClick={() => setEditing(true)}
                >
                    <Pencil size={16} aria-hidden />
                </Button>
                <Button
                    title={`Remove ${provider.name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    loading={busy == "delete"}
                    disabled={Boolean(busy)}
                    onClick={() => act("delete")}
                >
                    <Trash2 size={16} aria-hidden />
                </Button>
            </Row>
        </Row>
    );
}
