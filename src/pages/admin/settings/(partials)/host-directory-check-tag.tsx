import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import {
    HostDirectoryCheckStates,
    type HostDirectoryCheckState,
} from "@/src/dict/host-directory-dict";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    state: HostDirectoryCheckState;
    /**
     * When it was last checked on the computer.
     */
    checked_at?: number | null;
};

const Colors = {
    writable: "success",
    partial: "warning",
    "read-only": "gray",
    missing: "error",
    unknown: "gray",
} as const;

/**
 * What the last check of a host directory found: a tag, and when it was
 * checked.
 */
export default function HostDirectoryCheckTag({ state, checked_at }: Props) {
    const title =
        HostDirectoryCheckStates.find((item) => item.value == state)?.title ||
        "Not checked";

    return (
        <Row className="shrink-0 gap-2! flex-nowrap items-center">
            <Tag color={Colors[state]}>{title}</Tag>
            {checked_at ? (
                <Span className="text-[12px] leading-4 text-ink-secondary whitespace-nowrap">
                    checked {relativeTime({ at: checked_at })}
                </Span>
            ) : null}
        </Row>
    );
}