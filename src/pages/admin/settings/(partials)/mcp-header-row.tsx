import { Trash2 } from "lucide-react";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import RowIconButton from "@/src/components/general/row-icon-button";
import type { EnvKeyOption } from "@/src/types";
import type { McpHeaderLine } from "@/src/utils/mcp-headers";
import EnvValueField from "./envs/env-value-field";

type Props = {
    id: string;
    line: McpHeaderLine;
    /**
     * The envs its value can point at; left out where values are literal.
     */
    envs?: EnvKeyOption[];
    placeholder?: string;
    onChange: (line: McpHeaderLine) => void;
    /**
     * Shows the remove button; left out for the form's own header, which
     * can't be removed.
     */
    onRemove?: () => void;
    onNewEnv?: () => void;
};

/**
 * One hand-added header: its name, and a value that is typed in or one of
 * the general envs.
 */
export default function McpHeaderRow({ id, line, envs, placeholder, onChange, onRemove, onNewEnv }: Props) {
    return (
        <Stack className="gap-2! items-stretch">
            <Row className="gap-2! items-end">
                <Input
                    id={`${id}-name`}
                    title="Header name"
                    label="Header name"
                    showLabel
                    placeholder={placeholder || "X-Trace-Id"}
                    value={line.name}
                    autoComplete="off"
                    wrapperWrapperProps={{ className: "flex-1 min-w-0" }}
                    onChange={(e) => onChange({ ...line, name: e.target.value })}
                />
                {onRemove ? <RowIconButton icon={Trash2} title="Remove this header" onClick={onRemove} /> : null}
            </Row>
            <EnvValueField
                id={id}
                title="Value"
                value={line.value}
                envs={envs}
                onChange={(value) => onChange({ ...line, value })}
                onNewEnv={onNewEnv}
            />
        </Stack>
    );
}