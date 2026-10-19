import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageMarkdownComponents } from "@/src/pages/admin/bots/[bot_id]/(data)/message-markdown-components";
import SettingsGroup from "@/src/pages/admin/settings/(partials)/settings-group";
import type { HelpTopic } from "../(data)/help-topics";

/**
 * One help topic: the problem and when you'd see it on the left, the
 * answer (markdown, rendered like a bot message) on the right. Its id is
 * the anchor bots and other pages link to.
 */
export default function HelpTopicGroup({ id, title, summary, body }: HelpTopic) {
    return (
        <SettingsGroup id={id} title={title} description={summary}>
            <Stack className="gap-3! items-stretch min-w-0">
                <Markdown remarkPlugins={[remarkGfm]} components={MessageMarkdownComponents}>
                    {body}
                </Markdown>
            </Stack>
        </SettingsGroup>
    );
}
