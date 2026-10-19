import { useContext, useState } from "react";
import { AppContext } from "@/src/pages/__root";
import Modal from "@moduletrace/twui/elements/Modal";
import Button from "@moduletrace/twui/layout/Button";
import H2 from "@moduletrace/twui/layout/H2";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import ComputerView from "@/src/components/general/computer-view";
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
    const { computers, viewing, closeComputer } = useContext(BotComputersContext);
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
        <Modal
            open
            setOpen={(open) => {
                if (!open) closeComputer();
            }}
            className="max-w-[1280px] h-[90vh] p-0 bg-paper flex flex-col overflow-hidden"
        >
            <Row className="w-full gap-3! flex-nowrap items-center pl-5 pr-14 py-3 border-0 border-b border-solid border-hairline">
                <Stack className="min-w-0 gap-0! items-start">
                    <H2 className="text-base! leading-6! tracking-normal! font-bold text-ink truncate w-full">
                        {name}
                    </H2>
                    {viewing.take_over ? (
                        <Span className="text-[13px] leading-[18px] text-ink-secondary">
                            {`${bot_name} asked you to take over. Hand it back when you're done.`}
                        </Span>
                    ) : null}
                </Stack>
                {viewing.take_over ? (
                    <Stack className="ml-auto shrink-0 gap-1! items-end">
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
                            <Span role="alert" className="text-[13px] leading-[18px] text-ink-secondary">
                                {error}
                            </Span>
                        ) : null}
                    </Stack>
                ) : null}
            </Row>
            <ComputerView
                key={`${computer.id}-${viewing.mode}`}
                computer_id={computer.id}
                name={name}
                default_mode={viewing.mode}
                className="grow"
            />
        </Modal>
    );
}
