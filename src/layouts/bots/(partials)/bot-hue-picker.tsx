import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BotHues, type BotHue } from "@/src/dict/bot-dict";
import BotHueOption from "./bot-hue-option";

type Props = {
    hue: BotHue;
    disabled?: boolean;
    onChange: (hue: BotHue) => void;
};

/**
 * Picks a bot's colour from tiles that show each hue on a stone.
 */
export default function BotHuePicker({ hue, disabled, onChange }: Props) {
    return (
        <Stack className="w-full gap-2!">
            <Span className="text-xs text-ink-secondary">Colour</Span>
            <Row
                role="radiogroup"
                aria-label="Colour"
                className="w-full grid grid-cols-4 sm:grid-cols-7 gap-2!"
            >
                {BotHues.map((option) => (
                    <BotHueOption
                        key={option.value}
                        {...option}
                        selected={hue == option.value}
                        disabled={disabled}
                        onSelect={() => onChange(option.value)}
                    />
                ))}
            </Row>
            <Span className="text-xs text-ink-secondary">
                Its colour for life: how you tell it apart, even with a picture.
            </Span>
        </Stack>
    );
}
