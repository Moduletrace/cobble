import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import {
    HarnessProviderKinds,
    type HarnessProviderKind,
} from "@/src/dict/harness-provider-dict";
import type { HarnessOverviewPayload, PublicHarnessProvider } from "@/src/types";
import SettingsStatus from "../../(partials)/settings-status";
import postHarnessApi from "../(functions)/post-harness-api";

type Props = {
    /**
     * Edits this provider; adds one when not given.
     */
    provider?: PublicHarnessProvider;
    onSaved: (overview: HarnessOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits a provider. A saved key is never shown; typing a new one
 * replaces it.
 */
export default function ProviderForm({ provider, onSaved, onCancel }: Props) {
    const [kind, setKind] = useState<HarnessProviderKind>(
        provider?.kind || "openrouter",
    );
    const preset = HarnessProviderKinds.find((p) => p.value == kind)!;
    const [name, setName] = useState(provider?.name || "");
    const [base_url, setBaseUrl] = useState(provider?.base_url || "");
    const [api_key, setApiKey] = useState("");
    const [clear_key, setClearKey] = useState(false);
    const [enabled, setEnabled] = useState(provider?.enabled ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `provider-${provider?.id || "new"}`;

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);

        const res = await postHarnessApi({
            path: "save-provider",
            body: {
                provider_id: provider?.id,
                kind,
                name,
                base_url,
                api_key: api_key || undefined,
                clear_key: clear_key || undefined,
                enabled,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the provider.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <Form className="w-full gap-4! items-stretch" onSubmit={submit}>
            {provider ? null : (
                <Select
                    id={`${id}-kind`}
                    title="Provider"
                    label="Provider"
                    showLabel
                    options={HarnessProviderKinds.map((option) => ({
                        value: option.value,
                        title: option.title,
                        default: option.value == kind,
                    }))}
                    changeHandler={(value) => {
                        setKind(value as HarnessProviderKind);
                        setBaseUrl("");
                    }}
                />
            )}
            <Input
                id={`${id}-name`}
                title="Name"
                label="Name"
                showLabel
                placeholder={preset.title}
                defaultValue={name}
                onChange={(e) => setName(e.target.value)}
            />
            <Input
                id={`${id}-base-url`}
                key={`${id}-base-url-${kind}`}
                title="API address"
                label="API address"
                showLabel
                placeholder={preset.base_url || "http://localhost:8000/v1"}
                defaultValue={base_url}
                info={preset.base_url ? `Leave empty for ${preset.base_url}` : "Required: the server's OpenAI-compatible base URL."}
                onChange={(e) => setBaseUrl(e.target.value)}
            />
            <Input
                id={`${id}-key`}
                title="API key"
                label="API key"
                showLabel
                type="password"
                autoComplete="off"
                placeholder={provider?.has_key ? "Saved. Type a new key to replace it." : "Paste the key"}
                info={
                    preset.key_env
                        ? `Encrypted before it's stored. If empty, ${preset.key_env} from the environment is used.`
                        : "Encrypted before it's stored. Optional for this provider."
                }
                onChange={(e) => setApiKey(e.target.value)}
            />
            {provider?.has_key ? (
                <Checkbox
                    title="Remove the saved key"
                    label="Remove the saved key"
                    checked={clear_key}
                    changeHandler={setClearKey}
                />
            ) : null}
            <Checkbox
                title="Turn this provider on"
                label="Turned on"
                checked={enabled}
                changeHandler={setEnabled}
            />
            <Stack className="gap-3! items-stretch">
                <SettingsStatus status={error ? { error: true, msg: error } : undefined} />
                <Row className="gap-2! flex-nowrap justify-end">
                    <Button
                        title="Cancel"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={loading}
                        onClick={onCancel}
                    >
                        Cancel
                    </Button>
                    <Button
                        title={provider ? "Save provider" : "Add provider"}
                        type="submit"
                        size="small"
                        loading={loading}
                        disabled={loading}
                    >
                        {provider ? "Save provider" : "Add provider"}
                    </Button>
                </Row>
            </Stack>
        </Form>
    );
}
