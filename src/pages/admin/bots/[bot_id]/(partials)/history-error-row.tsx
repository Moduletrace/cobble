import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import Button from "@moduletrace/twui/layout/Button";

type Props = {
    error: string;
    onRetry: () => void;
};

/**
 * Under the header when the conversation's history couldn't load: why,
 * and a way to try again.
 */
export default function HistoryErrorRow({ error, onRetry }: Props) {
    return (
        <Row className="shrink-0 gap-3! flex-nowrap justify-center px-6 py-3 border-0 border-b border-solid border-hairline">
            <Span className="text-sm text-ink-secondary">{error}</Span>
            <Button title="Try again" type="button" variant="ghost" color="text" onClick={onRetry}>
                Try again
            </Button>
        </Row>
    );
}
