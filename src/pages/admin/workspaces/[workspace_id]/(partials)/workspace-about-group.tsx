import { useContext } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { BUN_SQLITE_COBBLE_WORKSPACES } from "@/db/types/db";
import WorkspaceAvatar from "@/src/components/general/workspace-avatar";
import { AppContext } from "@/src/pages/__root";
import { CrewBotsContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-bots-context";
import { CrewWorkspacesContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-workspaces-context";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import linkComputerRefs from "@/src/utils/link-computer-refs";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the context again.
 */
const RemarkPlugins = [remarkGfm];

type Props = {
    workspace: BUN_SQLITE_COBBLE_WORKSPACES;
};

/**
 * What the workspace is: its picture, name, what it's for, and the context
 * every bot working here gets, its refs (`[bot:ID]`, `[task:ID]`, ...) shown
 * as the chips a conversation shows.
 */
export default function WorkspaceAboutGroup({ workspace }: Props) {
    const { pageProps } = useContext(AppContext);
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
                <CrewBotsContext.Provider value={pageProps?.workspace_bots || []}>
                    <CrewWorkspacesContext.Provider value={pageProps?.workspaces || []}>
                        <Stack className="gap-3! items-stretch min-w-0">
                            <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                                {linkComputerRefs({ text: context })}
                            </Markdown>
                        </Stack>
                    </CrewWorkspacesContext.Provider>
                </CrewBotsContext.Provider>
            ) : (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    No context yet. Every bot here works from its own instructions alone.
                </Span>
            )}
        </SettingsGroup>
    );
}
