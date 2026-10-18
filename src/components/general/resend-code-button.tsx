import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type useFormInit from "@/src/hooks/use-form-init";
import resendLoginCode from "@/src/functions/frontend/resend-login-code";

type Props = Pick<
    ReturnType<typeof useFormInit>,
    "loading" | "setLoading" | "setStatus"
>;

export default function ResendCodeButton({
    loading,
    setLoading,
    setStatus,
}: Props) {
    return (
        <Row className="w-full justify-center gap-1.5 text-sm">
            <Span variant="faded">Didn't get a code?</Span>
            <Button
                title="Resend code"
                type="button"
                variant="ghost"
                size="small"
                loading={loading}
                onClick={() => {
                    resendLoginCode({ setLoading, setStatus });
                }}
            >
                Resend code
            </Button>
        </Row>
    );
}
