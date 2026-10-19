"use client";

import { useContext, useState } from "react";
import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import SettingsGroup from "../../(partials)/settings-group";
import NotificationsDeviceGroup from "../(partials)/notifications-device-group";
import NotificationsDevicesGroup from "../(partials)/notifications-devices-group";
import { AppContext } from "@/src/pages/__root";
import usePushNotifications from "@/src/hooks/use-push-notifications";
import type { PushOverview } from "@/src/types";

/**
 * Notifications settings: switch this device on or off, send a test, and
 * see the other devices that receive notifications.
 */
export default function NotificationsSection() {
    const { pageProps } = useContext(AppContext);
    const [overview, setOverview] = useState<PushOverview>({
        public_key: pageProps?.push_overview?.public_key || null,
        subscriptions: pageProps?.push_overview?.subscriptions || [],
    });
    const [devices_status, setDevicesStatus] = useState<string>();

    const push = usePushNotifications({ public_key: overview.public_key });

    const refresh = async () => {
        const res = await fetchApi<{}, APIResponseObject<PushOverview>>(
            "/api/admin/push/overview",
            { method: "GET" },
        );

        if (res.success && res.singleRes) {
            setOverview(res.singleRes);
        }
    };

    return (
        <>
            <SettingsGroup
                title="This device"
                description="A notification arrives when a bot replies or needs you and the app is closed. While the app is open, nothing is sent."
            >
                <NotificationsDeviceGroup {...push} onChanged={refresh} />
            </SettingsGroup>
            <SettingsGroup
                title="Devices"
                description="Every device that receives notifications. Removing one stops it here."
            >
                <NotificationsDevicesGroup
                    subscriptions={overview.subscriptions}
                    status={devices_status}
                    onRemoved={(msg) => {
                        setDevicesStatus(msg);
                        refresh();
                    }}
                />
            </SettingsGroup>
        </>
    );
}
