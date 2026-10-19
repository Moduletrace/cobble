import type { CustomToolKind } from "@/src/dict/custom-tool-dict";
import type { CustomToolHttpConfig, CustomToolPromptConfig, CustomToolScriptConfig } from "@/src/types";
import HttpToolFields from "./http-tool-fields";
import PromptToolFields from "./prompt-tool-fields";
import ScriptToolFields from "./script-tool-fields";

export type ToolConfigs = {
    http: CustomToolHttpConfig;
    script: CustomToolScriptConfig;
    prompt: CustomToolPromptConfig;
};

type Props = {
    id: string;
    kind: CustomToolKind;
    configs: ToolConfigs;
    onChange: (configs: ToolConfigs) => void;
};

/**
 * The fields of the tool's kind. Each kind keeps its own config, so
 * switching kinds back and forth loses nothing.
 */
export default function CustomToolKindFields({ id, kind, configs, onChange }: Props) {
    switch (kind) {
        case "http":
            return <HttpToolFields id={id} config={configs.http} onChange={(http) => onChange({ ...configs, http })} />;
        case "script":
            return (
                <ScriptToolFields id={id} config={configs.script} onChange={(script) => onChange({ ...configs, script })} />
            );
        case "prompt":
            return (
                <PromptToolFields id={id} config={configs.prompt} onChange={(prompt) => onChange({ ...configs, prompt })} />
            );
    }
}
