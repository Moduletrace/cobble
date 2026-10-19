import { useState } from "react";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import type { EnvScope, EnvsOverviewPayload, KnownEnvStatus, PublicEnv } from "@/src/types";
import SettingsStatus from "../../(partials)/settings-status";
import postEnvApi from "../(functions)/post-env-api";

type Props = {
    scope: EnvScope;
    /**
     * Edits this env; adds one when not given.
     */
    env?: PublicEnv;
    /**
     * Sets this app setting: its key, description and flags are fixed.
     */
    known?: KnownEnvStatus;
    onSaved: (overview: EnvsOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits an env in one scope. A saved secret is never shown; typing
 * a new value replaces it, leaving it empty keeps it.
 */
export default function EnvForm({ scope, env, known, onSaved, onCancel }: Props) {
    const is_known = Boolean(known || env?.known);
    const [key, setKey] = useState(env?.key || known?.key || "");
    const [value, setValue] = useState(env && !env.secret ? env.value || "" : "");
    const [description, setDescription] = useState(env?.description || "");
    const [secret, setSecret] = useState(env?.secret ?? known?.secret ?? true);
    const [expose, setExpose] = useState(env?.expose_to_computers ?? true);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `env-${env?.id || known?.key || "new"}`;
    const keeps_secret = Boolean(env?.secret);

    const submit = async () => {
        if (loading) return;
        if (!window.confirm(env?.id ? `Save ${env.key}?` : `Add ${key || "this env"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postEnvApi({
            path: "save-env",
            body: {
                env_id: env?.id,
                key,
                value: keeps_secret && !value ? undefined : value,
                description: is_known ? undefined : description,
                paradigm: scope.paradigm,
                workspace_id: scope.paradigm == "workspace" ? scope.id : null,
                computer_id: scope.paradigm == "computer" ? scope.id : null,
                secret,
                expose_to_computers: expose,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the env.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <Form className="w-full gap-4! items-stretch py-4" onSubmit={submit}>
            <Input
                id={`${id}-key`}
                title="Key"
                label="Key"
                showLabel
                placeholder="GITHUB_TOKEN"
                defaultValue={key}
                disabled={Boolean(env) || is_known}
                autoComplete="off"
                onChange={(e) => setKey(e.target.value)}
            />
            <Input
                id={`${id}-value`}
                title="Value"
                label="Value"
                showLabel
                type={secret ? "password" : "text"}
                autoComplete="off"
                defaultValue={value}
                placeholder={keeps_secret ? "Saved. Type a new value to replace it." : ""}
                info="Encrypted before it's stored."
                onChange={(e) => setValue(e.target.value)}
            />
            {is_known ? null : (
                <>
                    <Input
                        id={`${id}-description`}
                        title="Description"
                        label="Description"
                        showLabel
                        placeholder="A token for the company GitHub"
                        defaultValue={description}
                        info="Bots see the key and this description, never the value."
                        onChange={(e) => setDescription(e.target.value)}
                    />
                    <Checkbox
                        title="Secret"
                        label="Secret: hidden once saved, and blanked out of everything bots read"
                        checked={secret}
                        changeHandler={setSecret}
                    />
                    <Checkbox
                        title="Set on computers"
                        label="Set on computers, for bots' commands and code"
                        checked={expose}
                        changeHandler={setExpose}
                    />
                </>
            )}
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
                        title={env ? "Save env" : "Add env"}
                        type="submit"
                        size="small"
                        loading={loading}
                        disabled={loading}
                    >
                        {env ? "Save env" : "Add env"}
                    </Button>
                </Row>
            </Stack>
        </Form>
    );
}
