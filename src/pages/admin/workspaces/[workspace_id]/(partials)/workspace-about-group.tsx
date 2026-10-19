import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
};

/**
 * What the workspace is: its picture, name, what it's for, and the context
 * every bot working here gets.
 */
export default function WorkspaceAboutGroup({ workspace }: Props) {
    const name = workspace.name || "Workspace";
    const context = workspace.system_prompt?.trim();

    return (
        <SettingsGroup
            id="about"
            title="Workspace"
            description="Its picture, what it's for and the context every bot here gets."
        >
            <Row className="w-full gap-4! flex-nowrap items-center">
                <WorkspaceAvatar
                    size="lg"
                    image_media_id={workspace.image_media_id}
                />
                <Stack className="grow min-w-0 gap-0!">
                    <Span className="text-base font-bold leading-6 text-ink truncate w-full">
                        {name}
                    </Span>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {workspace.description || "No description yet."}
                    </Span>
                </Stack>
            </Row>
            {context ? (
                <Stack className="gap-3! items-stretch min-w-0">
                    <Markdown
                        remarkPlugins={[remarkGfm]}
                        components={MessageMarkdownComponents}
                    >
                        {context}
                    </Markdown>
                </Stack>
            ) : (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    No context yet. Every bot here works from its own instructions alone.
                </Span>
            )}
        </SettingsGroup>
    );
}
