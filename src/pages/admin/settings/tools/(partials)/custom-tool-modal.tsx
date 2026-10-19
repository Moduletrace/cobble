import { useState } from "react";
import AddFormActions from "@/src/layouts/bots/(partials)/add-form-actions";
import AddModalShell from "@/src/layouts/bots/(partials)/add-modal-shell";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Select from "@moduletrace/twui/form/Select";
import Textarea from "@moduletrace/twui/form/Textarea";
import CodeEditor from "@/src/components/general/code-editor";
import { CustomToolKinds, type CustomToolKind } from "@/src/dict/custom-tool-dict";
import postAdminApi from "@/src/layouts/bots/(functions)/post-admin-api";
import type { CustomToolsOverviewPayload, PublicCustomTool } from "@/src/types";
import { DefaultToolConfigs, DefaultToolParameters } from "../(data)/tool-defaults";
import CustomToolKindFields, { type ToolConfigs } from "./custom-tool-kind-fields";
import CustomToolTestPanel from "./custom-tool-test-panel";

type Props = {
    /**
     * Edits this tool; adds one when not given.
     */
    tool?: PublicCustomTool;
    onSaved: (overview: CustomToolsOverviewPayload, msg: string) => void;
    onCancel: () => void;
};

/**
 * Adds or edits a custom tool (super admins): the name and description
 * the model reads, its arguments as a JSON schema, and what it does (an
 * HTTP request, a script, or a prompt). Test runs the form as it is,
 * saved or not, with sample arguments.
 */
export default function CustomToolModal({ tool, onSaved, onCancel }: Props) {
    const [name, setName] = useState(tool?.name || "");
    const [description, setDescription] = useState(tool?.description || "");
    const [kind, setKind] = useState<CustomToolKind>(tool?.kind || "http");
    const [parameters, setParameters] = useState(
        tool?.parameters ? JSON.stringify(tool.parameters, null, 2) : DefaultToolParameters,
    );
    const [configs, setConfigs] = useState<ToolConfigs>({
        ...DefaultToolConfigs,
        ...(tool?.config ? { [tool.kind]: tool.config } : {}),
    });
    const [enabled, setEnabled] = useState(tool?.enabled ?? true);
    const [all_bots, setAllBots] = useState(tool?.access.all_bots ?? false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string>();

    const id = `tool-${tool?.id || "new"}`;

    /**
     * The tool as the form has it, for a test that saves nothing.
     */
    const draft = () => {
        try {
            return { draft: { parameters: JSON.parse(parameters), kind, config: configs[kind] } };
        } catch {
            return "The arguments schema isn't valid JSON.";
        }
    };

    const submit = async () => {
        if (loading) return;

        let parsed: unknown;

        try {
            parsed = JSON.parse(parameters);
        } catch {
            setError("The arguments schema isn't valid JSON.");
            return;
        }

        if (!window.confirm(tool ? `Save ${tool.name}?` : `Add ${name || "this tool"}?`)) return;

        setLoading(true);
        setError(undefined);

        const res = await postAdminApi<CustomToolsOverviewPayload>({
            path: "tools/save-tool",
            body: {
                custom_tool_id: tool?.id,
                name,
                description,
                kind,
                parameters: parsed,
                config: configs[kind],
                enabled,
                all_bots,
            },
        });

        setLoading(false);

        if (!res.success || !res.singleRes) {
            setError(res.msg || "Couldn't save the tool.");
            return;
        }

        onSaved(res.singleRes, res.msg || "Saved.");
    };

    return (
        <AddModalShell
            open
            setOpen={(next) => !next && onCancel()}
            title={tool ? `Edit ${tool.name}` : "Add a tool"}
            description={"Bots get it once it's attached to them."}
        >
            <Form className="w-full gap-4! items-stretch pt-4" onSubmit={submit}>
                <Input
                    id={`${id}-name`}
                    title="Name"
                    label="Name"
                    showLabel
                    placeholder="get_weather"
                    defaultValue={name}
                    autoComplete="off"
                    info="What bots call it: lowercase letters, numbers and underscores."
                    onChange={(e) => setName(e.target.value)}
                />
                <Textarea
                    id={`${id}-description`}
                    title="Description"
                    label="Description"
                    showLabel
                    rows={3}
                    placeholder="Gets the current weather for a city. Use it when the user asks about the weather."
                    defaultValue={description}
                    info="Bots read this to decide when to call it, so say what it does and when to use it."
                    onChange={(e) => setDescription(e.target.value)}
                />
                <CodeEditor
                    mode="json"
                    className="h-52"
                    title="Arguments"
                    content={parameters}
                    info='An object schema. Describe each argument: bots fill them in from it. {"type": "object", "properties": {}} takes none.'
                    onChange={(value) => setParameters(value)}
                />
                <Select
                    id={`${id}-kind`}
                    title="What it does"
                    label="What it does"
                    showLabel
                    options={CustomToolKinds.map((k) => ({ value: k.value, title: k.title, default: k.value == kind }))}
                    changeHandler={(value) => setKind(String(value) as CustomToolKind)}
                />
                <CustomToolKindFields key={kind} id={id} kind={kind} configs={configs} onChange={setConfigs} />
            <CustomToolTestPanel target={draft} />
                <Checkbox title="On" label="On: bots get it" checked={enabled} changeHandler={setEnabled} />
                <Checkbox
                    title="Every bot"
                    label="Every bot by default: every bot now and every new one, the coordinator included. Each can still drop it."
                    checked={all_bots}
                    changeHandler={setAllBots}
                />
                <AddFormActions submit_label={tool ? "Save" : "Add tool"} loading={loading} error={error} onCancel={onCancel} />
            </Form>
        </AddModalShell>
    );
}
