import { useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import Form from "@moduletrace/twui/form/Form";
import Input from "@moduletrace/twui/form/Input";
import Span from "@moduletrace/twui/layout/Span";
import Stack from "@moduletrace/twui/layout/Stack";
import type { ComputerWorkspaceQuotaOverview } from "@/src/functions/backend/db/app-settings/grab-computer-workspace-quota-overview";
import SettingsSaveBar from "../../(partials)/settings-save-bar";

type Props = {
    quota?: ComputerWorkspaceQuotaOverview | null;
};

/**
 * The most one computer's workspace may hold. A run's writes past it are
 * refused, so the bot frees space first; bash is never refused, since it is
 * how a bot cleans up. Saved on its own, without a reload.
 */
export default function ComputerWorkspaceQuotaForm({ quota }: Props) {
    const [overview, setOverview] = useState(quota || undefined);
    const [dirty, setDirty] = useState(false);
    const [value, setValue] = useState(String(quota?.quota_mb ?? ""));
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{
        msg?: string;
        error?: boolean;
        success?: boolean;
    }>();

    const save = async () => {
        setLoading(true);
        setStatus(undefined);

        const res = await fetchApi<{}, APIResponseObject<ComputerWorkspaceQuotaOverview>>(
            "/api/admin/settings/computer-workspace-quota",
            { method: "POST", body: { quota_mb: Number(value) || 0 } },
        ).catch(() => null);

        setLoading(false);

        if (!res?.success || !res.singleRes) {
            setStatus({
                error: true,
                msg: res?.msg || `Couldn't save the limit.`,
            });
            return;
        }

        setOverview(res.singleRes);
        setValue(String(res.singleRes.quota_mb));
        setDirty(false);
        setStatus({
            success: true,
            msg: res.singleRes.quota_mb > 0
                ? `Saved: ${res.singleRes.quota_mb} MB per computer.`
                : `Saved: no limit.`,
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
                    label="Megabytes per computer"
                    id="quota_mb"
                    className="scroll-mt-24"
                    type="number"
                    min={0}
                    step={512}
                    numberText
                    rawNumber
                    defaultValue={value}
                    onChange={(event) => {
                        setValue(event.target.value);
                        setDirty(true);
                        setStatus(undefined);
                    }}
                    suffix={`MB`}
                    info="Each computer's workspace gets this much. A write past it is refused, so the bot clears space first (bash still works, since it is how a bot cleans up). 0 sets no limit."
                />
                {overview ? (
                    <Span className="text-[13px] leading-[18px] text-ink-secondary">
                        {overview.quota_mb > 0
                            ? `Each computer may hold ${overview.quota_mb} MB.`
                            : `Computers have no limit.`}
                    </Span>
                ) : null}
            </Stack>
            <SettingsSaveBar
                dirty={dirty}
                loading={loading}
                status={status}
                save_label="Save limit"
                onDiscard={() => {
                    setValue(String(overview?.quota_mb ?? ""));
                    setDirty(false);
                    setStatus(undefined);
                }}
            />
        </Form>
    );
}