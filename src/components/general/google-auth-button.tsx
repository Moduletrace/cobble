import Button from "@moduletrace/twui/layout/Button";
import Img from "@moduletrace/twui/layout/Img";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import type useFormInit from "@/src/hooks/use-form-init";
import { twMerge } from "tailwind-merge";
import useGoogleAuth, {
    type GoogleAuthMode,
} from "@/src/hooks/use-google-auth";

type Props = Pick<
    ReturnType<typeof useFormInit>,
    "loading" | "setLoading" | "setStatus"
> & {
    mode: GoogleAuthMode;
};

/**
 * Themed button with Google's own (transparent) button laid over it. Once
 * Google's button is ready it takes keyboard focus and clicks, and the
 * themed button below is hidden from assistive tech.
 */
export default function GoogleAuthButton({
    mode,
    loading,
    setLoading,
    setStatus,
}: Props) {
    const { handleButtonClick, googleButtonRef, googleReady } = useGoogleAuth({
        mode,
        loading,
        setLoading,
        setStatus,
    });

    const overlayActive = googleReady && !loading;
    const label =
        mode == "signup" ? "Sign up with Google" : "Log in with Google";

    return (
        <Row className="w-full relative justify-center rounded-default focus-within:ring-2 focus-within:ring-primary/70">
            <Button
                title={label}
                type="button"
                variant="outlined"
                color="gray"
                className="w-full py-3 relative"
                disabled={loading}
                onClick={handleButtonClick}
                tabIndex={overlayActive ? -1 : undefined}
                aria-hidden={overlayActive || undefined}
            >
                <Img alt="" src={`/icons/google.png`} size={17} />
                <Span>{label}</Span>
            </Button>
            <div
                ref={googleButtonRef}
                className={twMerge(
                    "absolute inset-0 z-10 opacity-0",
                    overlayActive
                        ? "pointer-events-auto"
                        : "pointer-events-none",
                )}
            />
        </Row>
    );
}
