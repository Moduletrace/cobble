import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import type { EnvKeyOption } from "@/src/types";
import postGeneralEnv from "../../(functions)/post-general-env";

type Props = {
    /**
     * The fresh list of keys, and the one just saved, so the form that
     * asked can point at it.
     */
    onSaved: (envs: EnvKeyOption[], key: string) => void;
    onCancel: () => void;
};

/**
 * A key and token made from an MCP server's form, without leaving it:
 * always general, secret and never set on computers, which is what a
 * header's token is. Everything else about envs stays in Settings.
 */
export default function NewEnvModal({ onSaved, onCancel }: Props) {
    const [key, setKey] = useState("");
    const [value, setValue] = useState("");
    const [description, setDescription] = useState("");
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const submit = async () => {
        if (loading) return;

        setLoading(true);
        setError(undefined);

        const res = await postGeneralEnv({ key, value, description });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the env.");
            return;
        }

        onSaved(res.singleRes, key.trim());
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title="New env"
            description="Saved with everyone's envs, in Settings, under Environment. Secret, and kept out of bots' commands."
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id="new-env-key"
                    title="Key"
                    label="Key"
                    showLabel
                    placeholder="GITHUB_TOKEN"
                    value={key}
                    autoComplete="off"
                    onChange={(e) => setKey(e.target.value)}
                />
                <Input
                    id="new-env-value"
                    title="Value"
                    label="Value"
                    showLabel
                    type="password"
                    value={value}
                    autoComplete="off"
                    info="Encrypted before it's stored."
                    onChange={(e) => setValue(e.target.value)}
                />
                <Input
                    id="new-env-description"
                    title="Description"
                    label="Description"
                    showLabel
                    placeholder="A token for the company GitHub"
                    value={description}
                    info="Bots see the key and this description, never the value."
                    onChange={(e) => setDescription(e.target.value)}
                />
                <AddFormActions submit_label="Add env" loading={loading} error={error} onCancel={onCancel} />
            </Form>
        </AddModalShell>
    );
}