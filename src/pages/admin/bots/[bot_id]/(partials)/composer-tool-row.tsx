import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { X } from "lucide-react";
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
 * One MCP server, tool or skill the bot can use here, in the composer's
 * tools modal. One that isn't working says so, one that's off is struck
 * out. A skill has nothing to connect or run, so it never reports one.
 */
export default function ComposerToolRow({ item, busy, onRemove }: Props) {
    const Icon = extensionIcon({ kind: item.kind });
    const notes = [
        item.detail,
        item.source == "workspace" ? "From this workspace" : "",
        !item.enabled
            ? "Off for every bot"
            : item.kind == "skill"
              ? ""
              : item.state == "error"
                ? "Not working"
                : item.state == "untested"
                  ? "Not checked yet"
                  : "",
    ].filter(Boolean);

    return (
        <Row className="w-full gap-2.5! flex-nowrap items-center px-3 py-2 border-0 border-b border-solid border-hairline last:border-b-0">
            <Icon
                size={14}
                aria-hidden
                className="shrink-0 text-ink-secondary"
            />
            <Stack className="grow min-w-0 gap-0!">
                <Span
                    title={item.description}
                    className={`text-sm leading-5 truncate w-full ${item.enabled ? "text-ink" : "text-ink-secondary line-through"}`}
                >
                    {item.name}
                </Span>
                {notes.length ? (
                    <Span className="text-xs leading-4 text-ink-secondary truncate w-full">
                        {notes.join(" · ")}
                    </Span>
                ) : null}
            </Stack>
            {onRemove ? (
                <Button
                    title={`Remove ${item.name}`}
                    aria-label={`Remove ${item.name}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    disabled={busy}
                    onClick={onRemove}
                    className="shrink-0 p-1!"
                >
                    <X size={14} aria-hidden />
                </Button>
            ) : null}
        </Row>
    );
}
