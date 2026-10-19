import CodeEditor from "@/src/components/general/code-editor";
import type { CustomToolPromptConfig } from "@/src/types";

type Props = {
    id: string;
    config: CustomToolPromptConfig;
    onChange: (config: CustomToolPromptConfig) => void;
};

/**
 * A prompt tool's prompt, answered by the bot's text model.
 */
export default function PromptToolFields({ id, config, onChange }: Props) {
    return (
        <CodeEditor
            mode="markdown"
            className="h-52"
            title="Prompt"
            placeholder={"Summarise this contract for a busy founder. List the risks first.\n\n{{args.text}}"}
            content={config.prompt}
            info="{{args.name}} fills in an argument. The bot's text model answers it in one turn, without tools."
            onChange={(value) => onChange({ ...config, prompt: value })}
        />
    );
}
