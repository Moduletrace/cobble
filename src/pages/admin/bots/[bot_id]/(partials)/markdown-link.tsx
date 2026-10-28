import type { ComponentProps } from "react";
import Link from "@moduletrace/twui/layout/Link";
import { ComputerViewModes, type ComputerViewMode } from "@/src/dict/computer-dict";
import {
    BotRefHrefPrefix,
    ComputerRefHrefPrefix,
    FileRefHrefPrefix,
    HookProposalRefHrefPrefix,
    ProposalRefHrefPrefix,
    SecretRefHrefPrefix,
    SecretRequestRefHrefPrefix,
    TakeOverRefHrefPrefix,
    WorkspaceRefHrefPrefix,
} from "@/src/utils/link-computer-refs";
import { parseFolderRefHref } from "@/src/utils/folder-ref";
import { botQuestionRefId } from "@/src/utils/bot-question-ref";
import { graphicRefId } from "@/src/utils/graphic-ref";
import { chatroomRefId } from "@/src/utils/chatroom-ref";
import BotQuestionRefChip from "./bot-question-ref-chip";
import BotRefChip from "./bot-ref-chip";
import ChatroomRefChip from "./chatroom-ref-chip";
import ComputerRefChip from "./computer-ref-chip";
import FileRefChip from "./file-ref-chip";
import FolderRefChip from "./folder-ref-chip";
import GraphicRefCard from "./graphic-ref-card";
import HookProposalRefChip from "./hook-proposal-ref-chip";
import ProposalRefChip from "./proposal-ref-chip";
import SecretRefChip from "./secret-ref-chip";
import SecretRequestRefChip from "./secret-request-ref-chip";
import TakeOverChip from "./take-over-chip";
import WorkspaceRefChip from "./workspace-ref-chip";

/**
 * A link in a bot message. A computer the bot named (`linkComputerRefs`)
 * becomes its switch button, a take-over request a button that opens the
 * computer, a bot it named a link to that bot's conversation, a workspace
 * a link to that workspace, a file it saved a chip that previews it, a
 * folder it named a chip that opens it in the files browser, an MCP server,
 * tool, skill or hook it proposed a chip that opens the confirm card, a
 * secret it showed a masked chip, a secret it asked for a chip that opens
 * the card it's typed into, questions it asked a chip that opens the card
 * they're answered in, a graphic it made the graphic itself, a
 * chatroom a chip that opens it;
 * anything else opens in a new tab.
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

    if (href?.startsWith(ProposalRefHrefPrefix)) {
        const proposal_id = Number(href.slice(ProposalRefHrefPrefix.length));

        if (proposal_id) return <ProposalRefChip proposal_id={proposal_id} />;
    }

    if (href?.startsWith(HookProposalRefHrefPrefix)) {
        const proposal_id = Number(href.slice(HookProposalRefHrefPrefix.length));

        if (proposal_id) return <HookProposalRefChip proposal_id={proposal_id} />;
    }

    if (href?.startsWith(SecretRefHrefPrefix)) {
        const env_id = Number(href.slice(SecretRefHrefPrefix.length));

        if (env_id) return <SecretRefChip env_id={env_id} />;
    }

    if (href?.startsWith(SecretRequestRefHrefPrefix)) {
        const request_id = Number(href.slice(SecretRequestRefHrefPrefix.length));

        if (request_id) return <SecretRequestRefChip request_id={request_id} />;
    }

    const question_id = botQuestionRefId({ href });

    if (question_id) return <BotQuestionRefChip question_id={question_id} />;

    const chatroom_id = chatroomRefId({ href });

    if (chatroom_id) return <ChatroomRefChip chatroom_id={chatroom_id} />;

    const graphic_id = graphicRefId({ href });

    if (graphic_id) return <GraphicRefCard graphic_id={graphic_id} />;

    const folder_ref = parseFolderRefHref({ href });

    if (folder_ref) return <FolderRefChip spec={folder_ref.spec} path={folder_ref.path} />;

    return (
        <Link
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-ink underline underline-offset-2 hover:opacity-80 wrap-anywhere"
        >
            {children}
        </Link>
    );
}
