import Row from "@moduletrace/twui/layout/Row";
import Divider from "@moduletrace/twui/layout/Divider";
import Span from "@moduletrace/twui/layout/Span";

export default function AuthDivider() {
    return (
        <Row className="w-full flex-nowrap gap-4 -my-2">
            <Divider />
            <Span className="text-sm font-semibold opacity-50">OR</Span>
            <Divider />
        </Row>
    );
}
