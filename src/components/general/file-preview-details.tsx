import Span from "@moduletrace/twui/layout/Span";
import formatBytes from "@/src/utils/format-bytes";

type Props = {
    size?: number;
    /**
     * Where the file sits (`bots/3/reports/q3.md`).
     */
    full_path?: string;
};

/**
 * The line under a previewed file's name: its size and its full path,
 * whichever of them is known. The path wraps rather than cuts off, so all
 * of it can be read (and selected to copy).
 */
export default function FilePreviewDetails({ size, full_path }: Props) {
    const text = [size ? formatBytes({ bytes: size }) : "", full_path || ""].filter(Boolean).join(" · ");

    if (!text) return null;

    return (
        <Span title={full_path || undefined} className="w-full text-[13px] leading-[18px] text-ink-secondary break-all">
            {text}
        </Span>
    );
}
