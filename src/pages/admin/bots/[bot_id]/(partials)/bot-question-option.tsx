import Checkbox from "@moduletrace/twui/form/Checkbox";

type Props = {
    label: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
};

/**
 * One option of a multiple-choice question in a bot's question card.
 */
export default function BotQuestionOption({ label, checked, onChange }: Props) {
    return (
        <Checkbox
            title={label}
            label={label}
            size={18}
            checked={checked}
            changeHandler={(value) => {
                if (value != checked) onChange(value);
            }}
            wrapperClassName="flex-nowrap! md:flex-nowrap items-start! cursor-pointer"
            labelProps={{ className: "whitespace-normal md:whitespace-normal text-[13px] leading-5 text-ink break-words" }}
        />
    );
}
