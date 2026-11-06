import { useContext } from "react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { twMerge } from "tailwind-merge";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppContext } from "@/src/pages/__root";
import { CrewBotsContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-bots-context";
import { CrewWorkspacesContext } from "@/src/pages/admin/bots/[bot_id]/(data)/crew-workspaces-context";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import linkComputerRefs from "@/src/utils/link-computer-refs";

/**
 * Kept module-level: a new array on every render makes `react-markdown`
 * parse the text again.
 */
const RemarkPlugins = [remarkGfm];

type Props = {
    text: string;
    className?: string;
};

/**
 * A task's description or a note on it, rendered like a bot's message
 * (raw HTML never rendered, links in a new tab, refs as their chips). The
 * crew the chips link to is the page's own when no conversation around it
 * gives one. The message elements reach this file again through the task
 * chip, so they're read when it renders, never at load.
 */
export default function TaskMarkdown({ text, className }: Props) {
    const { pageProps } = useContext(AppContext);
    const crew_bots = useContext(CrewBotsContext);
    const crew_workspaces = useContext(CrewWorkspacesContext);
    const bots = crew_bots.length ? crew_bots : pageProps?.workspace_bots || pageProps?.bots || [];
    const workspaces = crew_workspaces.length ? crew_workspaces : pageProps?.workspaces || [];

    return (
        <CrewBotsContext.Provider value={bots}>
            <CrewWorkspacesContext.Provider value={workspaces}>
                <Stack className={twMerge("w-full min-w-0 gap-2! items-stretch", className)}>
                    <Markdown remarkPlugins={RemarkPlugins} components={MessageMarkdownComponents}>
                        {linkComputerRefs({ text })}
                    </Markdown>
                </Stack>
            </CrewWorkspacesContext.Provider>
        </CrewBotsContext.Provider>
    );
}
