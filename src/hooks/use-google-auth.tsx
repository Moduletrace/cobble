import fetchApi from "@moduletrace/twui/utils/fetch/fetchApi";
import type useFormInit from "@/src/hooks/use-form-init";
import { AppContext } from "@/src/pages/__root";
import type { ApiReqParams, GoogleWindow } from "@/src/types";
import type { APIResponseObject } from "@moduletrace/bunext/types";
import { useContext, useEffect, useRef, useState } from "react";

const GoogleScriptSelector =
    'script[src="https://accounts.google.com/gsi/client"]';

export type GoogleAuthMode = "login" | "signup";

type Params = Pick<
    ReturnType<typeof useFormInit>,
    "loading" | "setLoading" | "setStatus"
> & {
    mode: GoogleAuthMode;
};

export default function useGoogleAuth({
    loading,
    setStatus,
    setLoading,
    mode,
}: Params) {
    const { pageProps } = useContext(AppContext);

    const googleButtonRef = useRef<HTMLDivElement>(null);
    const googleInitializedRef = useRef(false);
    const [scriptLoaded, setScriptLoaded] = useState(false);
    const [buttonWidth, setButtonWidth] = useState(0);
    const [googleReady, setGoogleReady] = useState(false);

    const googleClientId = pageProps?.envs?.GOOGLE_CLIENT_ID;

    const submitGoogleAuth = async (google_token: string) => {
        setLoading(true);

        const res = await fetchApi<ApiReqParams, APIResponseObject>(
            `/api/auth/google-login`,
            {
                method: "POST",
                body: {
                    google_token,
                    google_signup: mode == "signup",
                },
            },
        );

        if (res.success) {
            window.location.pathname = `/admin`;
        } else {
            setStatus({
                error: true,
                msg:
                    res.msg ||
                    (mode == "signup"
                        ? "Couldn't sign up with Google."
                        : "Couldn't log in with Google."),
            });
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!googleClientId) {
            return;
        }

        const clientWindow = window as GoogleWindow;

        if (clientWindow.google?.accounts?.id) {
            setScriptLoaded(true);
            return;
        }

        const existingScript = document.querySelector(
            GoogleScriptSelector,
        ) as HTMLScriptElement | null;

        const handleLoad = () => {
            setScriptLoaded(true);
        };

        const handleError = () => {
            setStatus({
                error: true,
                msg: "Couldn't load Google sign-in.",
            });
        };

        if (existingScript) {
            existingScript.addEventListener("load", handleLoad);
            existingScript.addEventListener("error", handleError);

            return () => {
                existingScript.removeEventListener("load", handleLoad);
                existingScript.removeEventListener("error", handleError);
            };
        }

        const script = document.createElement("script");
        script.src = "https://accounts.google.com/gsi/client";
        script.async = true;
        script.defer = true;
        script.addEventListener("load", handleLoad);
        script.addEventListener("error", handleError);

        document.head.appendChild(script);

        return () => {
            script.removeEventListener("load", handleLoad);
            script.removeEventListener("error", handleError);
        };
    }, [googleClientId]);

    useEffect(() => {
        if (!googleButtonRef.current || typeof ResizeObserver === "undefined") {
            return;
        }

        const resizeObserver = new ResizeObserver((entries) => {
            const nextWidth = Math.round(entries[0]?.contentRect.width || 0);

            if (!nextWidth) {
                return;
            }

            setButtonWidth((prev) => (prev === nextWidth ? prev : nextWidth));
        });

        resizeObserver.observe(googleButtonRef.current);

        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    useEffect(() => {
        if (
            !googleClientId ||
            !scriptLoaded ||
            !googleButtonRef.current ||
            !buttonWidth
        ) {
            return;
        }

        const googleId = (window as GoogleWindow).google?.accounts?.id;

        if (!googleId) {
            return;
        }

        if (!googleInitializedRef.current) {
            googleId.initialize({
                client_id: googleClientId,
                callback: async ({ credential }) => {
                    if (!credential) {
                        setStatus({
                            error: true,
                            msg: "Google didn't return a sign-in token.",
                        });
                        return;
                    }

                    await submitGoogleAuth(credential);
                },
            });

            googleInitializedRef.current = true;
        }

        googleButtonRef.current.innerHTML = "";
        googleId.renderButton(googleButtonRef.current, {
            theme: "outline",
            size: "large",
            text: mode == "signup" ? "signup_with" : "signin_with",
            shape: "rectangular",
            width: Math.min(buttonWidth, 400),
        });
        setGoogleReady(true);
    }, [googleClientId, buttonWidth, scriptLoaded]);

    const handleButtonClick = () => {
        if (loading) {
            return;
        }

        if (!googleInitializedRef.current) {
            setStatus({
                error: true,
                msg: "Google sign-in is still loading. Please try again.",
            });
        }
    };

    return {
        loading,
        handleButtonClick,
        googleButtonRef,
        googleReady,
    };
}
