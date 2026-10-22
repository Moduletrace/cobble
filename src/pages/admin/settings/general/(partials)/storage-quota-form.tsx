import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { StorageQuotaOverview } from "@/src/functions/backend/db/app-settings/grab-storage-quota-overview";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    storage?: StorageQuotaOverview | null;
};

/**
 * The per-folder storage quota for what bots save (a bot's own folder and
 * each workspace's shared one). Saved on its own, without a reload.
 */
export default function StorageQuotaForm({ storage }: Props) {
    const [overview, setOverview] = useState(storage || undefined);
    const [dirty, setDirty] = useState(false);
    const [value, setValue] = useState(String(storage?.quota_mb ?? ""));
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<StorageQuotaOverview>>(
            "/api/admin/settings/storage-quota",
            { method: "POST", body: { quota_mb: Number(value) || 0 } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save the quota.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setValue(String(res.singleRes.quota_mb));
        setDirty(false);
        setStatus({
            success: true,
            msg: `Saved: ${res.singleRes.quota_mb} MB per folder.`,
        });
    };

    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault();
                save().catch(() => {});
            }}
            className="w-full gap-3! items-stretch"
        >
            <Stack className="w-full gap-1! items-stretch">
                <Input
                    label="Megabytes per folder"
                    type="number"
                    min={0}
                    step={8}
                    numberText
                    rawNumber
                    defaultValue={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`MB`}
                    info="A bot's own folder and each workspace's folder each get this much. A write past it is refused, so the bot clears space first."
                />
                {overview ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {`${overview.total_files} file(s) in ${overview.folders} folder(s), ${(overview.total_bytes / (1024 * 1024)).toFixed(1)} MB in total.`}
                    </Span>
                ) : null}
            </Stack>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save quota"
                onDiscard={() => {
                    setValue(String(overview?.quota_mb ?? ""));
                    setDirty(false);
                    setStatus(undefined);
                }}
            />
        </Form>
    );
}
