import { useContext, useState } from "react";
import Dropdown from "@moduletrace/twui/elements/Dropdown";
import Paper from "@moduletrace/twui/elements/Paper";
import Button from "@moduletrace/twui/layout/Button";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { ChevronDown, Monitor } from "lucide-react";
import type { BotWithLastMessage } from "@/src/types";
import { BotComputersContext } from "../(data)/bot-computers-context";
import BotComputerOption from "./bot-computer-option";

type Props = {
    bot: BotWithLastMessage;
};

/**
 * The header's computer button, beside the model button: shows the
 * computer the bot is on and, with more than one, switches it.
 */
export default function BotComputerSelect({ bot }: Props) {
    const { computers, switching_id, error, switchComputer } = useContext(BotComputersContext);
    const [open, setOpen] = useState(false);

    const current = computers[0];

    if (!current?.id) return null;

    const name = bot.name || "This bot";
    const can_switch = computers.length > 1;

    const target = (
        <Button
            title={
                can_switch
                    ? `${name} is on ${current.name}. Switch computers`
                    : `${name} is on ${current.name}, its only computer`
            }
            type="button"
            variant="outlined"
            color="gray"
            size="small"
            disabled={!can_switch}
            loading={Boolean(switching_id)}
            buttonContentProps={{ className: "min-w-0" }}
            className="max-w-full min-w-0 gap-2! flex-nowrap text-[13px] text-ink-secondary hover:text-ink"
        >
            <Monitor size={16} aria-hidden className="shrink-0 -mt-0.5" />
            <Span className="truncate">{current.name || "Computer"}</Span>
            {can_switch ? <ChevronDown size={14} aria-hidden className="shrink-0" /> : null}
        </Button>
    );

    if (!can_switch) {
        return <Stack className="max-w-[200px] min-w-0 shrink">{target}</Stack>;
    }

    return (
        <Dropdown
            target={target}
            position="bottom-right"
            externalOpen={open}
            externalSetOpen={setOpen}
            targetWrapperProps={{ className: "max-w-full min-w-0" }}
            className="max-w-[200px] min-w-0 shrink items-stretch"
        >
            <Paper
                role="menu"
                aria-label={`${name}'s computers`}
                className="w-[260px] p-0! py-1 gap-0! items-stretch rounded-default bg-surface dark:bg-surface border-hairline dark:border-hairline shadow-popover! dark:shadow-popover!"
            >
                {computers.map((computer, index) => (
                    <BotComputerOption
                        key={computer.id}
                        computer={computer}
                        current={index == 0}
                        onPick={async () => {
                            setOpen(false);
                            await switchComputer({ computer_id: computer.id || 0 });
                        }}
                    />
                ))}
                {error ? (
                    <Span role="alert" className="px-4 py-2 text-[13px] leading-[18px] text-ink-secondary">
                        {error}
                    </Span>
                ) : null}
            </Paper>
        </Dropdown>
    );
}
