import Input from "@moduletrace/twui/form/Input";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { X } from "lucide-react";
import { AppData } from "@/src/data/app-data";

type Props = {
    index: number;
    text: string;
    /**
     * A step that's already done is what was worked: it reads, and can't be
     * changed.
     */
    locked?: boolean;
    onChange: (params: { text: string }) => void;
    onRemove: () => void;
};

/**
 * One step in the plan editor: its text, and a way to take it out while
 * the plan hadn't worked it yet.
 */
export default function BotPlanStepField({ index, text, locked, onChange, onRemove }: Props) {
    return (
        <Row className="w-full flex-nowrap items-start gap-1.5!">
            <Span className="mt-2.5 w-5 shrink-0 text-right text-[12px] leading-4 font-bold text-ink-secondary">
                {index + 1}
            </Span>

            <Span className="min-w-0 grow">
                <Input
                    id={`plan-step-${index}`}
                    title={`Step ${index + 1}`}
                    label={`Step ${index + 1}`}
                    showLabel={false}
                    placeholder="What this step does, in one line"
                    defaultValue={text}
                    disabled={locked}
                    maxLength={AppData.BotPlanStepMaxChars}
                    autoComplete="off"
                    info={locked ? "Already worked: the line the bot wrote about it stays." : undefined}
                    onChange={(e) => onChange({ text: e.target.value })}
                />
            </Span>

            {locked ? null : (
                <Button
                    title={`Remove step ${index + 1}`}
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="smaller"
                    className="mt-1 shrink-0 p-1.5!"
                    onClick={onRemove}
                >
                    <X size={14} aria-hidden />
                </Button>
            )}
        </Row>
    );
}