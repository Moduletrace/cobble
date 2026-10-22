import { useState } from "react";
import Modal from "@moduletrace/twui/elements/Modal";
import H2 from "@moduletrace/twui/layout/H2";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import {
    HarnessParameterHarnesses,
    harnessParameterValue,
    HarnessParameterKeys,
    HarnessParameters,
    type HarnessParameterKey,
} from "@/src/dict/harness-parameter-dict";
import type { HarnessKind } from "@/src/dict/harness-dict";
import type { HarnessModelOption } from "@/src/types";
import HarnessParameterFields from "./harness-parameter-fields";

type Props = {
    id: string;
    /**
     * The harness the settings are for: its default fills an empty one.
     */
    harness: HarnessKind;
    /**
     * The model the settings are for: only what it takes is offered.
     */
    model: HarnessModelOption;
    params?: Record<string, number | string>;
    onChange: (params: Record<string, number | string>) => void;
};

/**
 * The generation settings for the picked model (temperature, reasoning
 * effort, sampling limits), in a modal so they don't lengthen the harness
 * block. The target reads "Model settings" and names what is set.
 */
export default function HarnessParameterModal({
    id,
    harness,
    model,
    params,
    onChange,
}: Props) {
    const [open, setOpen] = useState(false);
    /**
     * Nothing saved yet: every value shown is the app's default for it.
     */
    const using_defaults = !Object.entries(params || {}).some(
        ([key, value]) =>
            value !== undefined &&
            value !== "" &&
            HarnessParameterKeys.includes(key as HarnessParameterKey),
    );
    const set = HarnessParameters.flatMap((parameter) => {
        const { value } = harnessParameterValue({
            harness: harness as (typeof HarnessParameterHarnesses)[number],
            params,
            key: parameter.key,
        });

        if (value === undefined || value === "") return [];

        const label =
            parameter.value_type == "select"
                ? parameter.options.find((option) => option.value == value)
                      ?.title || String(value)
                : String(value);

        return [`${parameter.title} ${label}`];
    });

    return (
        <Modal
            target={
                <Stack className="gap-0.5! items-start cursor-pointer">
                    <Span className="text-sm text-ink underline decoration-hairline-strong underline-offset-2">
                        Model settings
                    </Span>
                    <Span className="text-xs leading-4 text-ink-secondary">
                        {set.length
                            ? `${using_defaults ? "Default: " : ""}${set.join(" · ")}`
                            : "Temperature, reasoning effort, sampling limits"}
                    </Span>
                </Stack>
            }
            targetWrapperProps={{
                className:
                    "self-start rounded-default-sm focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2 focus-visible:ring-offset-paper",
            }}
            open={open}
            setOpen={setOpen}
            className="max-w-lg bg-paper p-6"
        >
            <Stack className="w-full gap-1! items-stretch pb-2">
                <H2 className="text-lg! leading-6! tracking-normal! font-bold text-ink">
                    {model.name} settings
                </H2>
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    How this model answers. The filled-in values are what it
                    runs on now (the app's default for this harness, else the
                    provider's own); a lower temperature keeps a bot literal
                    and repeatable.
                </Span>
            </Stack>
            <Stack className="w-full gap-4! items-stretch">
                <HarnessParameterFields
                    id={id}
                    harness={harness}
                    model={model}
                    params={params}
                    onChange={onChange}
                />
            </Stack>
        </Modal>
    );
}
