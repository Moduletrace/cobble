import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Stack from "@moduletrace/twui/layout/Stack";
import type { SkillLimitsOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    limits?: SkillLimitsOverview | null;
};

/**
 * The longest runbook a skill may save and how much of it a bot reads at
 * once, saved on its own without a reload. Zero puts the code's default
 * back for that one.
 */
export default function SkillLimitsForm({ limits }: Props) {
    const [overview, setOverview] = useState(limits || undefined);
    const [dirty, setDirty] = useState(false);
    const [body_max_chars, setBodyMaxChars] = useState(String(limits?.body_max_chars ?? ""));
    const [body_shown_chars, setBodyShownChars] = useState(String(limits?.body_shown_chars ?? ""));
    /**
     * The inputs only read `defaultValue` when they mount, so discarding or
     * saving remounts them with the saved numbers.
     */
    const [form_key, setFormKey] = useState(0);
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        if (!window.confirm("Save the skill limits?")) return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<SkillLimitsOverview>>(
            "/api/admin/settings/skill-limits",
            {
                method: "POST",
                body: {
                    body_max_chars: Number(body_max_chars) || 0,
                    body_shown_chars: Number(body_shown_chars) || 0,
                },
            },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save the limits.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setBodyMaxChars(String(res.singleRes.body_max_chars));
        setBodyShownChars(String(res.singleRes.body_shown_chars));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: runbooks up to ${res.singleRes.body_max_chars} characters, ${res.singleRes.body_shown_chars} read at once.`,
        });
    };

    const discard = () => {
        setBodyMaxChars(String(overview?.body_max_chars ?? ""));
        setBodyShownChars(String(overview?.body_shown_chars ?? ""));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus(undefined);
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            <Stack className="w-full gap-3! items-stretch">
                <Input
                    key={`max-${form_key}`}
                    label="Longest runbook"
                    type="number"
                    min={0}
                    max={overview?.max}
                    step={1}
                    numberText
                    rawNumber
                    defaultValue={body_max_chars}
                    onChange={(event) => {
                        setBodyMaxChars(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`characters`}
                    info={`How long a skill's runbook may be when it's saved or proposed. A skill already longer keeps working until its runbook is edited. 0 uses the default (${overview?.body_max_default ?? ""}).`}
                />
                <Input
                    key={`shown-${form_key}`}
                    label="Runbook a bot reads at once"
                    type="number"
                    min={0}
                    max={overview?.max}
                    step={1}
                    numberText
                    rawNumber
                    defaultValue={body_shown_chars}
                    onChange={(event) => {
                        setBodyShownChars(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`characters`}
                    info={`How much of a runbook a bot gets when it loads the skill; past that it's cut and the bot is told so. All of it goes into the model's context. 0 uses the default (${overview?.body_shown_default ?? ""}).`}
                />
            </Stack>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save limits"
                onDiscard={discard}
            />
        </Form>
    );
}
