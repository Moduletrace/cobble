import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessagesSquare } from "lucide-react";
import GraphicFrame from "@/src/components/general/graphic-frame";
import SettingsPaneHeader from "@/src/pages/admin/settings/(partials)/settings-pane-header";
import { AppContext } from "@/src/pages/__root";
import conversationHref from "@/src/utils/conversation-href";
import Center from "@moduletrace/twui/layout/Center";

/**
 * A graphic filling the window (the page has no rail), under a header
 * naming it and its bot, with a link back to the conversation it was made
 * in.
 */
export default function GraphicPageSection() {
    const { pageProps } = useContext(AppContext);
    const graphic = pageProps?.graphic;

    if (!graphic) return null;

    return (
        <Stack className="grow min-w-0 h-full gap-0! items-stretch">
            <SettingsPaneHeader
                title={graphic.title}
                description={`By ${graphic.bot_name}`}
                action={
                    <Link
                        href={conversationHref({
                            bot_id: graphic.bot_id,
                            workspace_id: graphic.workspace_id,
                            session_id: graphic.session_id,
                        })}
                        title="Back to the conversation"
                        aria-label="Back to the conversation"
                        className="p-2 text-ink-secondary hover:text-ink rounded-default hover:bg-sunken"
                    >
                        <MessagesSquare size={16} aria-hidden />
                    </Link>
                }
            />
            <Center>
                <Stack className="grow min-h-0 gap-0! items-stretch max-w-[1200px] w-full">
                    <GraphicFrame
                        graphic_id={graphic.id}
                        title={graphic.title}
                        version={graphic.version}
                        className="grow h-full"
                    />
                </Stack>
            </Center>
        </Stack>
    );
}
