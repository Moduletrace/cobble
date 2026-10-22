import { useEffect, useState } from "react";
import Input from "@moduletrace/twui/form/Input";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import { BotHues, type BotStoneShape } from "@/src/dict/bot-dict";
import { normalizeBotColor, paletteColorTitle } from "@/src/utils/bot-color";
import BotColourOption from "./bot-colour-option";
import BotColourSwatch from "./bot-colour-swatch";

type Props = {
    /**
     * The bot's colour as `#rrggbb`.
     */
    color: string;
    /**
     * Which stone shape it's drawn on. Picking a palette tile sets both, so a
     * palette bot looks exactly as it always did.
     */
    stone: BotStoneShape;
    disabled?: boolean;
    onChange: (picked: { color: string; stone: BotStoneShape }) => void;
};

/**
 * Picks a bot's colour: the palette tiles (each on its own stone), or any
 * colour at all from the swatch or the hex field. A custom colour keeps the
 * stone the bot already has, so its shape stays its own.
 */
export default function BotColourPicker({ color, stone, disabled, onChange }: Props) {
    const [hex, setHex] = useState(color);
    const [invalid, setInvalid] = useState(false);
    const picked = paletteValueFor({ color });
    const palette_title = paletteColorTitle({ color });

    useEffect(() => setHex(color), [color]);

    const commitHex = (value: string) => {
        setHex(value);

        const normalized = normalizeBotColor({ color: value });

        setInvalid(Boolean(value.trim()) && !normalized);

        if (normalized) onChange({ color: normalized, stone });
    };

    return (
        <Stack className="w-full gap-2!">
            <Span className="text-xs text-ink-secondary">Colour</Span>
            <Row
                role="radiogroup"
                aria-label="Colour"
                className="w-full grid grid-cols-4 sm:grid-cols-7 gap-2!"
            >
                {BotHues.map((option) => (
                    <BotColourOption
                        key={option.value}
                        {...option}
                        selected={option.value == picked}
                        disabled={disabled}
                        onSelect={() =>
                            onChange({ color: option.color, stone: option.value })
                        }
                    />
                ))}
            </Row>
            <Row className="w-full flex-nowrap items-end gap-2!">
                <Stack className="shrink-0 gap-1!">
                    <Span className="text-xs text-ink-secondary">Any colour</Span>
                    <BotColourSwatch
                        color={color}
                        disabled={disabled}
                        title="Pick a colour"
                        onChange={(next) => onChange({ color: next, stone })}
                    />
                </Stack>
                <Input
                    type="text"
                    id="bot-form-color-hex"
                    title="Hex value"
                    label="Hex value"
                    showLabel
                    autoComplete="off"
                    placeholder="#7c5cd6"
                    value={hex}
                    disabled={disabled}
                    className="grow"
                    variant={invalid ? "error" : "normal"}
                    info={invalid ? "Use a colour like #7c5cd6" : undefined}
                    onChange={(e) => commitHex(e.target.value)}
                    onBlur={() => !invalid && setHex(color)}
                />
            </Row>
            <Span className="text-xs text-ink-secondary">
                {palette_title
                    ? "A palette colour. Pick any colour, or type a hex, to make it its own."
                    : "Its own colour. Its stone keeps its shape."}
            </Span>
        </Stack>
    );
}

/**
 * The palette entry a colour is, by comparing hexes.
 */
function paletteValueFor({ color }: { color: string }): string | null {
    const normalized = normalizeBotColor({ color });

    if (!normalized) return null;

    return BotHues.find((entry) => entry.color == normalized)?.value || null;
}
