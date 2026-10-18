import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import H3 from "@moduletrace/twui/layout/H3";
import Button from "@moduletrace/twui/layout/Button";
import { CircleCheck, RotateCcw } from "lucide-react";

type Props = {
    msg?: string;
    onReset: () => void;
};

export default function ContactFormSuccess({ msg, onReset }: Props) {
    return (
        <Stack className="w-full items-start gap-6! py-6">
            <CircleCheck size={28} strokeWidth={1.5} className="text-accent" />
            <Stack className="gap-2!">
                <H3>Message sent</H3>
                <Span className="text-slate-500 dark:text-slate-400 leading-relaxed">
                    {msg || "Thanks for reaching out."} We'll reply to the
                    email address you provided.
                </Span>
            </Stack>
            <Button
                title="Send another message"
                variant="outlined"
                color="gray"
                onClick={onReset}
                beforeIcon={<RotateCcw size={15} />}
            >
                Send another
            </Button>
        </Stack>
    );
}
