import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { MessageSquare } from "lucide-react";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace, BotHue } from "@/src/dict/bot-dict";
import type { BotWithLastMessage } from "@/src/types";
import SettingsGroup from "../../../(partials)/settings-group";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * The bot at a glance: its stone or picture, name, job and status, then a
 * way into its chat.
 */
export default function BotOverviewGroup({ bot }: Props) {
    const name = bot.name || `Bot ${bot.id}`;
    const is_coordinator = bot.kind == "coordinator";

    return (
        <SettingsGroup
            id="overview"
            title="Overview"
            description="What this bot is here for."
        >
            <Row className="w-full gap-4! flex-nowrap items-center">
                <BotAvatar
                    image_media_id={bot.image_media_id}
                    hue={(bot.hue || null) as BotHue | null}
                    face={(bot.face || "idle") as BotFace}
                    size={40}
                />
                <Stack className="grow min-w-0 gap-0!">
                    <Span className="text-sm font-bold leading-5 text-ink truncate w-full">
                        {name}
                    </Span>
                    <Span className="text-[13px] leading-[18px] text-ink-secondary truncate w-full">
                        {[
                            is_coordinator ? "Coordinator" : "Worker",
                            bot.role,
                            bot.status_line,
                        ]
                            .filter(Boolean)
                            .join(" · ")}
                    </Span>
                </Stack>
                <Button
                    title={`Chat with ${name}`}
                    type="button"
                    variant="outlined"
                    color="gray"
                    size="small"
                    href={`/admin/bots/${bot.id}`}
                    beforeIcon={<MessageSquare size={14} aria-hidden />}
                    className="shrink-0"
                >
                    Open chat
                </Button>
            </Row>
        </SettingsGroup>
    );
}
