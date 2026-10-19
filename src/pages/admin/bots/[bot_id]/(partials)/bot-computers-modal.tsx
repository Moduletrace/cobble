import { useContext, useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { Monitor } from "lucide-react";
import type { BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import BotComputerOption from "./bot-computer-option";
import HeaderIconButton from "./header-icon-button";

type Props = {
    bot: BotWithLastMessage;
    /**
     * In a workspace the bot uses the workspace's computers, and a switch
     * changes the workspace's default for every bot there.
     */
    workspace_name?: string | null;
};

/**
 * The header's computer icon, beside the model icon: opens what the bot's
 * computers are, the one it's on checked, and with more than one,
 * switches it. Each can be opened in the viewer.
 */
export default function BotComputersModal({ bot, workspace_name }: Props) {
    const { computers, switching_id, error, switchComputer, openComputer } =
        useContext(BotComputersContext);
    const [open, setOpen] = useState(false);

    const current = computers[0];

    if (!current?.id) return null;

    const name = bot.name || "This bot";
    const can_switch = computers.length > 1;

    return (
        <Modal
            target={
                <HeaderIconButton
                    icon={Monitor}
                    title={can_switch ? `Switch ${name}'s computer` : `About ${name}'s computer`}
                    loading={Boolean(switching_id)}
                />
            }
            targetWrapperProps={{ className: "shrink-0" }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {can_switch ? `${name}'s computers` : `${name}'s computer`}
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {`A computer is a sandbox ${name} works in: a shell, a browser and files of its own. Its tasks run on the checked one. Open one to use it yourself.`}
                </Span>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {workspace_name
                        ? can_switch
                            ? `These are ${workspace_name}'s computers. Picking another makes it the default for every bot working here.`
                            : `This is ${workspace_name}'s only computer. Add more on the workspace's page.`
                        : can_switch
                          ? `Pick another to move ${name} there. You can also click a computer it names in a message.`
                          : `This is the only computer ${name} can use right now.`}
                </Span>
            </Stack>
            <Stack
                role="radiogroup"
                aria-label={`${name}'s computers`}
                className="w-full mt-4 py-1 gap-0! items-stretch rounded-default border border-solid border-hairline bg-surface"
            >
                {computers.map((computer, index) => (
                    <BotComputerOption
                        key={computer.id}
                        computer={computer}
                        current={index == 0}
                        onPick={async () => {
                            await switchComputer({ computer_id: computer.id || 0 });
                        }}
                        onOpen={() => {
                            setOpen(false);
                            openComputer({ computer_id: computer.id || 0, mode: "browser" });
                        }}
                    />
                ))}
            </Stack>
            {error ? (
                <Span role="alert" className="mt-3 text-[13px] leading-[18px] text-ink-secondary">
                    {error}
                </Span>
            ) : null}
        </Modal>
    );
}
