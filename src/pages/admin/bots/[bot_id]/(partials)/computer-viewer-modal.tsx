import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import SharedComputerViewerModal from "@/src/components/general/computer-viewer-modal";
import type { BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import sendBotMessage from "../(functions)/send-bot-message";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * The computer the user opened (from the computers modal, or a take-over
 * the bot asked for), large, in its browser, terminal or code editor.
 * After a take-over the user hands it back from here, which tells the
 * bot in chat so it carries on.
 */
export default function ComputerViewerModal({ bot }: Props) {
    const { pageProps } = useContext(AppContext);
    const { computers, viewing, closeComputer } =
        useContext(BotComputersContext);
    const [handing_back, setHandingBack] = useState(false);
    const [error, setError] = useState<string>();

    const computer = computers.find((c) => c.id == viewing?.computer_id);

    if (!viewing || !computer?.id) return null;

    const name = computer.name || `Computer ${computer.id}`;
    const bot_name = bot.name || "the bot";

    const handBack = async () => {
        setHandingBack(true);
        setError(undefined);

        const res = await sendBotMessage({
            bot_id: bot.id || 0,
            workspace_id: pageProps?.workspace?.id || null,
            text: `I'm done on ${name}. You can carry on.`,
            media_ids: [],
        }).catch(() => null);

        setHandingBack(false);

        if (res?.success) closeComputer();
        else setError(res?.msg || "Couldn't tell the bot");
    };

    return (
        <SharedComputerViewerModal
            open
            onClose={closeComputer}
            computer_id={Number(computer.id)}
            name={name}
            default_mode={viewing.mode}
            note={
                viewing.take_over
                    ? `${bot_name} asked you to take over. Hand it back when you're done.`
                    : undefined
            }
            action={
                viewing.take_over ? (
                    <>
                        <Button
                            type="button"
                            size="small"
                            loading={handing_back}
                            onClick={handBack}
                            title={`Tell ${bot_name} you're done`}
                        >
                            {`Hand back to ${bot_name}`}
                        </Button>
                        {error ? (
                            <Span
                                role="alert"
                                className="text-[13px] leading-[18px] text-ink-secondary"
                            >
                                {error}
                            </Span>
                        ) : null}
                    </>
                ) : undefined
            }
        />
    );
}
