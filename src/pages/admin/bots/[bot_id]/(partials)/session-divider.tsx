import Divider from "@moduletrace/twui/layout/Divider";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";

/**
 * Between an earlier session opened above the thread and the session
 * that carries on from it. What's above is shown only: the bot doesn't
 * read it unless it looks it up.
 */
export default function SessionDivider() {
    return (
        <Row className="w-full flex-nowrap gap-4! items-center">
            <Divider className="border-hairline dark:border-hairline" />
            <Span className="shrink-0 text-[13px] leading-[18px] text-ink-secondary">
                New session
            </Span>
            <Divider className="border-hairline dark:border-hairline" />
        </Row>
    );
}
