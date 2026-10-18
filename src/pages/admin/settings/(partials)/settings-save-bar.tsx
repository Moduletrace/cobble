import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";
import type { ComponentProps } from "react";
import SettingsStatus from "./settings-status";

type Props = {
    dirty: boolean;
    loading?: boolean;
    status?: ComponentProps<typeof SettingsStatus>["status"];
    save_label?: string;
    onDiscard?: () => void;
};

/**
 * Sticks to the bottom of the pane. Save is only enabled once something
 * changed, and says so; Discard puts the form back.
 */
export default function SettingsSaveBar({
    dirty,
    loading,
    status,
    save_label = "Save changes",
    onDiscard,
}: Props) {
    return (
        <Row className="sticky bottom-0 z-10 w-full min-h-16 gap-3! flex-nowrap items-center justify-between py-3 bg-paper border-0 border-t border-solid border-hairline">
            {status?.msg ? (
                <SettingsStatus status={status} />
            ) : (
                <Span className="text-[13px] leading-[18px] text-ink-secondary">
                    {dirty ? "You have unsaved changes." : "No changes yet."}
                </Span>
            )}
            <Row className="gap-2! flex-nowrap shrink-0">
                {dirty && onDiscard ? (
                    <Button
                        title="Discard changes"
                        type="button"
                        variant="ghost"
                        color="gray"
                        size="small"
                        disabled={loading}
                        onClick={onDiscard}
                    >
                        Discard
                    </Button>
                ) : null}
                <Button
                    title={save_label}
                    type="submit"
                    size="small"
                    disabled={!dirty || loading}
                    loading={loading}
                >
                    {save_label}
                </Button>
            </Row>
        </Row>
    );
}
