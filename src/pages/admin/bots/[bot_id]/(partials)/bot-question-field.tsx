import Input from "@moduletrace/twui/form/Input";
import Radios from "@moduletrace/twui/form/Radios";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { AppData } from "@/src/data/app-data";
import type { BotQuestionAnswer, BotQuestionItem } from "@/src/types";
import type { BotQuestionDraft } from "../(utils)/bot-question-draft-answer";
import BotQuestionOption from "./bot-question-option";
import MessageDetailsHeading from "./message-details-heading";

type Props = {
    question_id: number;
    index: number;
    item: BotQuestionItem;
    draft: BotQuestionDraft;
    /**
     * What the user answered, once they did.
     */
    answer: BotQuestionAnswer | null;
    /**
     * Whether it still takes answers.
     */
    open: boolean;
    onChange: (draft: BotQuestionDraft) => void;
};

/**
 * Value of the "Other" radio, beside the options' indexes.
 */
const OtherValue = "other";

/**
 * One of a bot's questions in its card: the question, then its options as
 * radios (one pick) or checkboxes (several), with "Other" and a field to
 * type into when the bot allows it. Once answered, what the user picked.
 */
export default function BotQuestionField({ question_id, index, item, draft, answer, open, onChange }: Props) {
    const single = item.kind == "single";
    const picked = answer
        ? [...answer.choices.map((choice) => item.options[choice]), answer.other ? `Other: ${answer.other}` : ""].filter(Boolean)
        : [];

    return (
        <Stack className="w-full gap-0! items-stretch">
            <MessageDetailsHeading>{`${index + 1}. ${single ? "Pick one" : "Pick any"}`}</MessageDetailsHeading>
            <Span className="whitespace-pre-wrap text-[13px] leading-5 font-bold text-ink break-words">{item.question}</Span>

            {open ? (
                <Stack className="mt-2 w-full gap-2! items-stretch">
                    {single ? (
                        <Radios
                            name={`question-${question_id}-${index}`}
                            values={[
                                ...item.options.map((option, choice) => ({ value: String(choice), title: option })),
                                ...(item.allow_other ? [{ value: OtherValue, title: "Other" }] : []),
                            ]}
                            wrapperProps={{ className: "w-full flex-col items-start gap-2!" }}
                            labelProps={{ className: "text-[13px] leading-5 text-ink break-words cursor-pointer" }}
                            changeHandler={(value) =>
                                onChange(
                                    value == OtherValue
                                        ? { ...draft, choices: [], other_on: true }
                                        : { ...draft, choices: [Number(value)], other_on: false },
                                )
                            }
                        />
                    ) : (
                        <Stack className="w-full gap-2! items-stretch">
                            {item.options.map((option, choice) => (
                                <BotQuestionOption
                                    key={choice}
                                    label={option}
                                    checked={draft.choices.includes(choice)}
                                    onChange={(checked) =>
                                        onChange({
                                            ...draft,
                                            choices: checked
                                                ? [...new Set([...draft.choices, choice])]
                                                : draft.choices.filter((c) => c != choice),
                                        })
                                    }
                                />
                            ))}
                            {item.allow_other ? (
                                <BotQuestionOption
                                    label="Other"
                                    checked={draft.other_on}
                                    onChange={(checked) => onChange({ ...draft, other_on: checked })}
                                />
                            ) : null}
                        </Stack>
                    )}

                    {draft.other_on ? (
                        <Input
                            id={`question-${question_id}-${index}-other`}
                            title="Your answer"
                            placeholder="Your own answer"
                            maxLength={AppData.BotQuestionOtherMaxChars}
                            value={draft.other}
                            onChange={(e) => onChange({ ...draft, other: e.target.value })}
                        />
                    ) : null}
                </Stack>
            ) : answer ? (
                <Span className="mt-1 whitespace-pre-wrap text-[13px] leading-5 text-ink-secondary break-words">
                    {picked.join("; ")}
                </Span>
            ) : null}
        </Stack>
    );
}
