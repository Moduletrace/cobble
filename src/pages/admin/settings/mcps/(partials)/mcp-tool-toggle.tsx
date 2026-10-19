import Checkbox from "@moduletrace/twui/form/Checkbox";
import type { McpToolInfo } from "@/src/types";

type Props = {
    tool: McpToolInfo;
    on: boolean;
    onChange: (on: boolean) => void;
};

/**
 * One of a server's tools, ticked when bots get it.
 */
export default function McpToolToggle({ tool, on, onChange }: Props) {
    return (
        <Checkbox
            title={tool.description}
            label={`${tool.name}: ${tool.description.split("\n")[0]?.slice(0, 120) || ""}`}
            checked={on}
            changeHandler={onChange}
        />
    );
}
