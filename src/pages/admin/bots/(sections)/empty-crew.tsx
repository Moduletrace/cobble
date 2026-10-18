import Center from "@moduletrace/twui/layout/Center";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import BotStone from "@/src/components/general/bot-stone";

export default function EmptyCrew() {
    return (
        <Center className="grow h-full">
            <Stack className="items-center gap-3!">
                <BotStone face="asleep" size={64} />
                <Span className="text-sm font-bold text-ink">No bots yet</Span>
                <Span className="text-sm text-ink-secondary">
                    Add a bot and give it a job.
                </Span>
            </Stack>
        </Center>
    );
}
