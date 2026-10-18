import { useContext } from "react";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import H2 from "@moduletrace/twui/layout/H2";
import { AppContext } from "@/src/pages/__root";
import TaskStepRow from "../(partials)/task-step-row";
import OpenComputerButton from "../(partials)/open-computer-button";

/**
 * 280px panel listing the steps the bot is taking. Hidden below 1280px.
 */
export default function WorkingOnPanel() {
    const { pageProps } = useContext(AppContext);
    const task = pageProps?.bot_task;

    return (
        <Stack
            className="hidden xl:flex w-[280px] shrink-0 h-full gap-0! items-stretch px-6 border-0 border-l border-solid border-hairline"
            aria-label="Working on"
        >
            <Span className="pt-[34px] text-xs font-bold leading-4 tracking-[0.06em] uppercase text-ink-secondary">
                Working on
            </Span>
            {task ? (
                <>
                    <H2 className="mt-2.5 text-sm! leading-5! tracking-normal! font-bold text-ink">
                        {task.title}
                    </H2>
                    <Stack className="mt-4 gap-0! items-stretch">
                        {task.steps.map((step) => (
                            <TaskStepRow
                                key={step.id}
                                label={step.label || ""}
                                state={step.state || "pending"}
                            />
                        ))}
                    </Stack>
                </>
            ) : (
                <Span className="mt-2.5 text-[13px] leading-5 text-ink-secondary">
                    Nothing in progress.
                </Span>
            )}
            <Stack className="mt-auto h-[88px] shrink-0 gap-0! items-stretch justify-center">
                {task ? <OpenComputerButton url={task.computer_url} /> : null}
            </Stack>
        </Stack>
    );
}
