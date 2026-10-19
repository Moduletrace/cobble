import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { CircleAlert, X } from "lucide-react";
import extensionIcon from "@/src/components/general/extension-icon";
import type { BotExtension } from "@/src/types";

type Props = {
    item: BotExtension;
    busy?: boolean;
    /**
     * Takes it from the bot; not given for a workspace's own or when the
     * user can't.
     */
    onRemove?: () => void;
};

/**
 * One MCP server or tool the bot can use here, under the composer. One
 * that isn't working shows an alert icon, one that's off is struck out.
 */
export default function ComposerToolChip({ item, busy, onRemove }: Props) {
    const Icon = item.state == "error" ? CircleAlert : extensionIcon({ kind: item.kind });
    const notes = [
        item.detail,
        item.source == "workspace" ? "From this workspace" : "",
        !item.enabled ? "Off for every bot" : item.state == "error" ? "Not working" : "",
    ].filter(Boolean);

    return (
        <Row
            title={`${item.name}: ${notes.join(" · ")}${item.description ? `\n${item.description}` : ""}`}
            className={`max-w-48 gap-1.5! flex-nowrap items-center rounded-default-lg border border-solid border-hairline bg-surface pl-2 py-0.5 text-[12px] leading-4 ${onRemove ? "pr-0.5" : "pr-2"} ${item.enabled ? "text-ink" : "text-ink-secondary line-through"}`}
        >
            <Icon size={12} aria-hidden className="shrink-0" />
            <Span className="truncate">{item.name}</Span>
            {onRemove ? (
                <Button
                    title={`Remove ${item.name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    className="shrink-0 p-0.5!"
                    disabled={busy}
                    onClick={onRemove}
                >
                    <X size={12} aria-hidden />
                </Button>
            ) : null}
        </Row>
    );
}
