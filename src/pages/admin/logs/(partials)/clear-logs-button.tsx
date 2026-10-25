import { Trash2 } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import { LogCategoryFilters } from "../(data)/log-category-filters";
import type { LogCategoryValue } from "../(data)/log-category-styles";
import clearLogs from "../(functions)/clear-logs";

type Props = {
    category?: LogCategoryValue;
    count?: number;
    afterClear: () => void;
};

/**
 * Deletes every log in the open tab ("All" deletes every log).
 */
export default function ClearLogsButton({ category, count, afterClear }: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();

    const title = LogCategoryFilters.find((filter) => filter.value == category)?.title || "All";

    const clear_logs = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await clearLogs({ category, title, count });

        setLoading(false);

        if (res.success) {
            afterClear();
        } else if (res.msg) {
            setStatus({ error: true, msg: res.msg });
        }
    };

    return (
        <Row className="gap-2! flex-nowrap">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <Button
                title={category ? `Delete all ${title} logs` : "Delete all logs"}
                variant="ghost"
                color="error"
                size="small"
                loading={loading}
                disabled={!count}
                onClick={() => {
                    clear_logs();
                }}
            >
                <Row className="gap-2! flex-nowrap">
                    <Trash2 size={15} />
                    <Span>{category ? `Delete all ${title}` : "Delete all"}</Span>
                </Row>
            </Button>
        </Row>
    );
}
