"use client";

import Stack from "@moduletrace/twui/layout/Stack";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import Checkbox from "@moduletrace/twui/form/Checkbox";
import { useState } from "react";
import { BellRing, Send } from "lucide-react";
import type usePushNotifications from "@/src/hooks/use-push-notifications";

type Props = ReturnType<typeof usePushNotifications> & {
    onChanged?: () => void;
};

const StateCopy: Record<string, string> = {
    loading: "Checking this device.",
    dev: "Notifications need the installed app. They work in a production build over https, or on localhost.",
    unsupported:
        "This browser can't receive notifications. On iPhone and iPad, add the app to the Home Screen first, then open it from there.",
    "needs-install":
        "Add the app to the Home Screen first. iPhone and iPad only allow notifications for installed apps.",
    denied:
        "Notifications are blocked for this site. Allow them in the browser's site settings, then reload this page.",
};

/**
 * The switch for the device the settings are open on, and a test send.
 */
export default function NotificationsDeviceGroup({
    state,
    enabled,
    busy,
    error,
    enable,
    disable,
    send_test,
    onChanged,
}: Props) {
    const [test_status, setTestStatus] = useState<string>();
    const can_switch = state == "on" || state == "off";
    const copy = error || StateCopy[state];

    return (
        <Stack className="w-full gap-4! items-stretch">
            <Row className="w-full gap-3! flex-nowrap items-start">
                <Checkbox
                    checked={enabled}
                    readOnly={!can_switch || busy}
                    label="Notifications on this device"
                    clickDispatchHandler={async (on) => {
                        if (!can_switch || busy) return;

                        const ok = on ? await enable() : await disable();

                        if (ok) onChanged?.();
                    }}
                />
            </Row>
            {copy ? (
                <Span
                    role={error ? "alert" : "status"}
                    className="text-[13px] leading-[18px] text-ink-secondary"
                >
                    {copy}
                </Span>
            ) : null}
            <Row className="gap-2! flex-nowrap">
                <Button
                    title="Send a test notification to this user's devices"
                    type="button"
                    variant="ghost"
                    color="gray"
                    size="small"
                    disabled={!enabled || busy}
                    loading={busy}
                    beforeIcon={
                        enabled ? <Send size={15} /> : <BellRing size={15} />
                    }
                    onClick={async () => {
                        setTestStatus(undefined);
                        const ok = await send_test();
                        if (ok) setTestStatus("Test sent. It may take a few seconds to arrive.");
                    }}
                >
                    Send a test
                </Button>
            </Row>
            {test_status ? (
                <Span
                    role="status"
                    className="text-[13px] leading-[18px] text-ink-secondary"
                >
                    {test_status}
                </Span>
            ) : null}
        </Stack>
    );
}
