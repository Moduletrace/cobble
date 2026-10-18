import Span from "@moduletrace/twui/layout/Span";
import { CircleAlert, Check } from "lucide-react";
import { twMerge } from "tailwind-merge";

type Props = {
    status?: {
        error?: boolean;
        success?: boolean;
        msg?: string;
    };
};

/**
 * One quiet line for the result of a save. State is said in words with an
 * icon, never with color alone.
 */
export default function SettingsStatus({ status }: Props) {
    if (!status?.msg || (!status.error && !status.success)) {
        return null;
    }

    const Icon = status.error ? CircleAlert : Check;

    return (
        <Span
            role={status.error ? "alert" : "status"}
            className={twMerge(
                "flex items-center gap-1.5 text-[13px] leading-[18px]",
                status.error ? "text-ink" : "text-ink-secondary",
            )}
        >
            <Icon size={14} aria-hidden className="shrink-0" />
            {status.msg}
        </Span>
    );
}
