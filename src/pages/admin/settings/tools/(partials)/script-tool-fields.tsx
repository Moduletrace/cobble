import Select from "@moduletrace/twui/form/Select";
import CodeEditor from "@/src/components/general/code-editor";
import { CustomToolScriptLanguages, type CustomToolScriptLanguage } from "@/src/dict/custom-tool-dict";
import type { CustomToolScriptConfig } from "@/src/types";
import TimeoutField from "./timeout-field";

type Props = {
    id: string;
    config: CustomToolScriptConfig;
    onChange: (config: CustomToolScriptConfig) => void;
};

/**
 * A script tool's code and language. It runs on the bot's computer.
 */
export default function ScriptToolFields({ id, config, onChange }: Props) {
    const language =
        CustomToolScriptLanguages.find((l) => l.value == config.language) || CustomToolScriptLanguages[0];

    return (
        <>
            <Select
                id={`${id}-language`}
                title="Language"
                label="Language"
                showLabel
                options={CustomToolScriptLanguages.map((language) => ({
                    value: language.value,
                    title: language.title,
                    default: language.value == config.language,
                }))}
                changeHandler={(value) => onChange({ ...config, language: String(value) as CustomToolScriptLanguage })}
            />
            <CodeEditor
                title="Code"
                mode={language.editor_mode}
                className="h-72"
                content={config.code}
                info="Runs on the bot's current computer (the task's in a task) with its envs set. The arguments come as JSON in $COBBLE_ARGS and on stdin; what it prints goes back to the bot."
                onChange={(code) => onChange({ ...config, code })}
            />
            <TimeoutField id={id} timeout_ms={config.timeout_ms} onChange={(timeout_ms) => onChange({ ...config, timeout_ms })} />
        </>
    );
}
