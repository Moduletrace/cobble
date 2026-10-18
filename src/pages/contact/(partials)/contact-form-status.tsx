import Tag from "@moduletrace/twui/elements/Tag";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type { TWUIStatusType } from "@moduletrace/twui/hooks/useStatus";
import { TriangleAlert } from "lucide-react";

type Props = {
    status?: TWUIStatusType;
};

export default function ContactFormStatus({ status }: Props) {
    if (!status?.error || !status.msg) {
        return null;
    }

    return (
        <Tag
            variant="outlined"
            color="error"
            className="w-full py-1.5 outline-error/50 bg-error/5!"
        >
            <Row className="flex-nowrap gap-2!">
                <TriangleAlert size={15} className="shrink-0" />
                <Span>{status.msg}</Span>
            </Row>
        </Tag>
    );
}
