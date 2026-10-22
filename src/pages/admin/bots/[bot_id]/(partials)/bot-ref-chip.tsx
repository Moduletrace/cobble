import { useContext } from "react";
import Link from "@moduletrace/twui/layout/Link";
import Span from "@moduletrace/twui/layout/Span";
import BotAvatar from "@/src/components/general/bot-avatar";
import type { BotFace } from "@/src/dict/bot-dict";
import botStoneProps from "@/src/utils/bot-stone-props";
import { AppContext } from "@/src/pages/__root";
import { CrewBotsContext } from "../(data)/crew-bots-context";

type Props = {
    bot_id: number;
};

/**
 * A crew member a bot named in a message (`botRef`): a link to its
 * conversation, in the open workspace when it's in the crew there, else
 * its own chat. A bot the user doesn't reach is shown by name only.
 */
export default function BotRefChip({ bot_id }: Props) {
    const { pageProps } = useContext(AppContext);
    const workspace_id = pageProps?.workspace?.id;
    const bots = useContext(CrewBotsContext);
    const bot = bots.find((b) => b.id == bot_id);

    if (!bot) {
        return <Span className="font-bold">{`bot ${bot_id}`}</Span>;
    }

    return (
        <Link
            href={
                workspace_id
                    ? `/admin/workspaces/${workspace_id}/bots/${bot.id}`
                    : `/admin/bots/${bot.id}`
            }
            title={`Open ${bot.name}`}
            className="inline-flex h-6 gap-1.5 items-center px-1.5 align-middle rounded-default-xs border-0 bg-sunken text-[13px] font-bold leading-4 text-ink whitespace-nowrap hover:opacity-80"
        >
            <BotAvatar
                image_media_id={bot.image_media_id}
                {...botStoneProps({ color: bot.color, stone: bot.stone, hue: bot.hue })}
                face={(bot.face || "idle") as BotFace}
                label={bot.name || ""}
                size={18}
            />
            {bot.name}
        </Link>
    );
}
