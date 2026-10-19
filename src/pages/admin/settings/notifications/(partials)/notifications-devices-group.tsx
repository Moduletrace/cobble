"use client";

import { useState } from "react";
import Span from "@moduletrace/twui/layout/Span";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import type { PushDeviceOverview } from "@/src/types";
import SettingsList from "../../(partials)/settings-list";
import NotificationDeviceRow from "./notification-device-row";

type Props = {
    subscriptions: PushDeviceOverview[];
    status?: string;
    onRemoved?: (msg?: string) => void;
};

/**
 * Every device this user gets notifications on.
 */
export default function NotificationsDevicesGroup({
    subscriptions,
    status,
    onRemoved,
}: Props) {
    const [removing_id, setRemovingId] = useState<number>();

    const remove = async (id: number) => {
        setRemovingId(id);

        const res = await fetchApi<{}, APIResponseObject>(
            "/api/admin/push/remove-device",
            { method: "POST", body: { id } },
        );

        setRemovingId(undefined);

        if (res.success) onRemoved?.("Device removed.");
    };

    return (
        <>
            <SettingsList
                is_empty={!subscriptions.length}
                empty="No device yet. Turn notifications on above."
            >
                {subscriptions.map((subscription) => (
                    <NotificationDeviceRow
                        key={subscription.id}
                        subscription={subscription}
                        removing={removing_id == subscription.id}
                        onRemove={() => remove(subscription.id)}
                    />
                ))}
            </SettingsList>
            {status ? (
                <Span role="status" className="text-[13px] leading-[18px] text-ink-secondary">
                    {status}
                </Span>
            ) : null}
        </>
    );
}
