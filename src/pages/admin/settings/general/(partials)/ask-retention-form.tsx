import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import type { AskRetentionOverview } from "@/src/types";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    retention?: AskRetentionOverview | null;
};

/**
 * How long ended crew requests are kept, and how many one place keeps,
 * saved on its own without a reload. Zero puts the code's defaults back.
 */
export default function AskRetentionForm({ retention }: Props) {
    const [overview, setOverview] = useState(retention || undefined);
    const [dirty, setDirty] = useState(false);
    const [keep_days, setKeepDays] = useState(String(retention?.keep_days ?? ""));
    const [max_per_place, setMaxPerPlace] = useState(String(retention?.max_per_place ?? ""));
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
        if (
            !window.confirm(
                "Save how long crew requests are kept? Older ones are deleted at the next daily prune.",
            )
        )
            return;

        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<AskRetentionOverview>>(
            "/api/admin/settings/ask-retention",
            {
                method: "POST",
                body: {
                    keep_days: Number(keep_days) || 0,
                    max_per_place: Number(max_per_place) || 0,
                },
            },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save it.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setKeepDays(String(res.singleRes.keep_days));
        setMaxPerPlace(String(res.singleRes.max_per_place));
        setFormKey((key) => key + 1);
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: requests are kept for ${res.singleRes.keep_days} days, ${res.singleRes.max_per_place} per place.`,
        });
    };

    const discard = () => {
        setKeepDays(String(overview?.keep_days ?? ""));
        setMaxPerPlace(String(overview?.max_per_place ?? ""));
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
            <Input
                key={`keep-${form_key}`}
                label="Keep ended requests for"
                id="keep_days"
                className="scroll-mt-24"
                type="number"
                min={0}
                max={overview?.keep_days_max}
                step={1}
                numberText
                rawNumber
                defaultValue={keep_days}
                onChange={(event) => {
                    setKeepDays(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                suffix={`days`}
                info={`A request keeps its brief, the coordinator's decision and the answer, so a long time on a busy crew grows the database. 0 uses the default (${overview?.keep_days_default ?? ""}).`}
            />
            <Input
                key={`max-${form_key}`}
                label="Most ended requests per place"
                id="max_per_place"
                className="scroll-mt-24"
                type="number"
                min={0}
                max={overview?.max_per_place_max}
                step={1}
                numberText
                rawNumber
                defaultValue={max_per_place}
                onChange={(event) => {
                    setMaxPerPlace(event.target.value);
                    setDirty(true);
                    setStatus(undefined);
                }}
                info={`Once a place has more ended requests than this, the oldest are deleted. 0 uses the default (${overview?.max_per_place_default ?? ""}).`}
            />
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save"
                onDiscard={discard}
            />
        </Form>
    );
}
