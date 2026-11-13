import type { ReactNode } from "react";
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
import { botSuggestionRefId } from "@/src/utils/bot-suggestion-ref";
import { graphicRefId } from "@/src/utils/graphic-ref";
import { chatroomRefId } from "@/src/utils/chatroom-ref";
import { taskRefId } from "@/src/utils/task-ref";
import { generalSettingsRefId } from "@/src/utils/general-settings-ref";
import BotQuestionRefChip from "../(partials)/bot-question-ref-chip";
import BotSuggestionsRef from "../(partials)/bot-suggestions-ref";
import BotRefChip from "../(partials)/bot-ref-chip";
import ChatroomRefChip from "../(partials)/chatroom-ref-chip";
import ComputerRefChip from "../(partials)/computer-ref-chip";
import FileRefChip from "../(partials)/file-ref-chip";
import FolderRefChip from "../(partials)/folder-ref-chip";
import GraphicRefCard from "../(partials)/graphic-ref-card";
import HookProposalRefChip from "../(partials)/hook-proposal-ref-chip";
import ProposalRefChip from "../(partials)/proposal-ref-chip";
import SecretRefChip from "../(partials)/secret-ref-chip";
import SecretRequestRefChip from "../(partials)/secret-request-ref-chip";
import SettingRefChip from "../(partials)/setting-ref-chip";
import TakeOverChip from "../(partials)/take-over-chip";
import TaskRefChip from "../(partials)/task-ref-chip";
import WorkspaceRefChip from "../(partials)/workspace-ref-chip";

/**
 * The chip a ref link in a bot message stands for (`linkComputerRefs`): a
 * computer its switch button, a take-over request a button that opens the
 * computer, a bot or workspace a link to it, a file a chip that previews
 * it, a folder a chip that opens it in the files browser, a proposal a chip
 * that opens the confirm card, a secret a masked chip, a secret request or
 * questions a chip that opens their card, suggested next steps the
 * buttons that fill the input, a graphic the graphic itself, a
 * chatroom or task a chip that opens it, a setting a pill to that group of
 * Settings > General. Null for any other link.
 */
export default function refChipForHref({ href }: { href?: string }): ReactNode | null {
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

    const suggestion_id = botSuggestionRefId({ href });
    if (suggestion_id) return <BotSuggestionsRef suggestion_id={suggestion_id} />;

    const chatroom_id = chatroomRefId({ href });

    if (chatroom_id) return <ChatroomRefChip chatroom_id={chatroom_id} />;

    const task_id = taskRefId({ href });

    if (task_id) return <TaskRefChip task_id={task_id} />;

    const graphic_id = graphicRefId({ href });

    if (graphic_id) return <GraphicRefCard graphic_id={graphic_id} />;

    const setting_ref = generalSettingsRefId({ href });

    if (setting_ref) return <SettingRefChip section={setting_ref.section} field={setting_ref.field} />;

    const folder_ref = parseFolderRefHref({ href });

    if (folder_ref) return <FolderRefChip spec={folder_ref.spec} path={folder_ref.path} />;

    return null;
}
