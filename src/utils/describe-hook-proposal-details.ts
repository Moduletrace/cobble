import type { HookProposalAction } from "@/src/dict/bot-hook-dict";
import type { HookProposalData } from "@/src/schemas/bot-hook-schema";
import type { BotHookWithNames, ExtensionProposalDetail } from "@/src/types";

type Params = {
    action: HookProposalAction;
    data: HookProposalData;
    /**
     * The hook it changes, as it is now.
     */
    current?: BotHookWithNames | null;
    /**
     * Where a new hook runs: the workspace's name, none for the bot's own
     * chat.
     */
    workspace_name?: string | null;
    /**
     * Computer names by id.
     */
    computers: Map<number, string>;
};

/**
 * What a hook proposal would save, line by line for its card, read from
 * the data Confirm saves (never from what the bot said): for a new hook
 * what calls it, where it runs, on which computer and its whole brief;
 * for a change each field as it is and as it would be.
 */
export default function describeHookProposalDetails({
    action,
    data,
    current,
    workspace_name,
    computers,
}: Params): ExtensionProposalDetail[] {
    const computer = (id?: number | null) => (id ? `${computers.get(Number(id)) || "Computer"} (#${id})` : "");

    if (action == "create") {
        const watching = data.source == "browser_notifications";

        return [
            { label: "Name", value: data.title || "" },
            {
                label: "Called by",
                value: watching
                    ? `Browser notifications on ${computer(data.watch_computer_id)}`
                    : "Anyone with its URL (shown to you once, when you confirm)",
            },
            ...(watching ? [{ label: "Takes", value: data.watch_filter ? `Only notifications containing "${data.watch_filter}"` : "Every notification" }] : []),
            { label: "Runs in", value: workspace_name ? `The workspace ${workspace_name}` : "The bot's own chat with you" },
            {
                label: "Runs on",
                value: computer(data.computer_id || (watching ? data.watch_computer_id : null)) || "The bot's current computer",
            },
            { label: "Brief", value: data.instructions || "", block: true },
        ];
    }

    const lines: ExtensionProposalDetail[] = [
        { label: "Hook", value: `#${current?.id} ${current?.title || ""}`.trim() },
    ];

    if (data.title !== undefined) {
        lines.push({ label: "Name now", value: current?.title || "" }, { label: "New name", value: data.title });
    }

    if (data.instructions !== undefined) {
        lines.push(
            { label: "Brief now", value: current?.instructions || "", block: true },
            { label: "New brief", value: data.instructions, block: true },
        );
    }

    if (data.watch_filter !== undefined) {
        lines.push(
            { label: "Filter now", value: current?.watch_filter || "None: every notification" },
            { label: "New filter", value: data.watch_filter || "None: every notification" },
        );
    }

    if (data.enabled) lines.push({ label: "Switch on", value: "It's paused now; calls would run again" });

    return lines;
}
