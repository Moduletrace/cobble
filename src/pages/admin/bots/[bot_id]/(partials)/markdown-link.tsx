import type { ComponentProps } from "react";
import Link from "@moduletrace/twui/layout/Link";
import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
import {
    BotRefHrefPrefix,
    ComputerRefHrefPrefix,
    FileRefHrefPrefix,
    TakeOverRefHrefPrefix,
    WorkspaceRefHrefPrefix,
} from "@/src/utils/link-computer-refs";
import { parsePathRefHref } from "@/src/utils/path-ref";
import BotRefChip from "./bot-ref-chip";
import ComputerRefChip from "./computer-ref-chip";
import FileRefChip from "./file-ref-chip";
import PathRefChip from "./path-ref-chip";
import TakeOverChip from "./take-over-chip";
import WorkspaceRefChip from "./workspace-ref-chip";

/**
 * A link in a bot message. A computer the bot named (`linkComputerRefs`)
 * becomes its switch button, a take-over request a button that opens the
 * computer, a bot it named a link to that bot's conversation, a workspace
 * a link to that workspace, a file it saved a chip that opens it; anything
 * else opens in a new tab.
 */
export default function MarkdownLink({ href, children }: ComponentProps<"a">) {
    if (href?.startsWith(ComputerRefHrefPrefix)) {
        const computer_id = Number(href.slice(ComputerRefHrefPrefix.length));

        if (computer_id) return <ComputerRefChip computer_id={computer_id} />;
    }

    if (href?.startsWith(TakeOverRefHrefPrefix)) {
        const [id, mode] = href.slice(TakeOverRefHrefPrefix.length).split("-");
        const computer_id = Number(id);
        const known = ComputerViewModes.some((m) => m.value == mode);

        if (computer_id) {
            return (
                <TakeOverChip
                    computer_id={computer_id}
                    mode={(known ? mode : ComputerViewModes[0].value) as ComputerViewMode}
                />
            );
        }
    }

    if (href?.startsWith(BotRefHrefPrefix)) {
        const bot_id = Number(href.slice(BotRefHrefPrefix.length));

        if (bot_id) return <BotRefChip bot_id={bot_id} />;
    }

    if (href?.startsWith(WorkspaceRefHrefPrefix)) {
        const workspace_id = Number(href.slice(WorkspaceRefHrefPrefix.length));

        if (workspace_id) return <WorkspaceRefChip workspace_id={workspace_id} />;
    }

    if (href?.startsWith(FileRefHrefPrefix)) {
        const file_id = Number(href.slice(FileRefHrefPrefix.length));

        if (file_id) return <FileRefChip file_id={file_id} />;
    }

    const path_ref = parsePathRefHref({ href });

    if (path_ref) return <PathRefChip spec={path_ref.spec} path={path_ref.path} />;

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:opacity-80 break-words"
        >
            {children}
        </Link>
    );
}
