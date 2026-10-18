import type { ComponentProps } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import useStatus from "@moduletrace/twui/hooks/useStatus";
import deleteLogs from "../(functions)/delete-logs";

type Props = Omit<ComponentProps<typeof Button>, "onClick" | "title"> & {
    ids: number[];
    afterDelete: (params: { deleted_ids: number[] }) => void;
    title?: string;
};

export default function DeleteLogsButton({
    ids,
    afterDelete,
    title,
    ...props
}: Props) {
    const { loading, setLoading, status, setStatus } = useStatus();

    const delete_logs = async () => {
        setStatus(undefined);
        setLoading(true);

        const res = await deleteLogs({ ids });

        setLoading(false);

        if (res.success) {
            afterDelete({ deleted_ids: ids });
        } else if (res.msg) {
            setStatus({ error: true, msg: res.msg });
        }
    };

    return (
        <Row className="gap-2! flex-nowrap">
            {status?.error && <Tag color="error">{status.msg}</Tag>}
            <Button
                title={title || "Delete Log"}
                variant="ghost"
                color="error"
                loading={loading}
                {...props}
                onClick={() => {
                    delete_logs();
                }}
            />
        </Row>
    );
}
