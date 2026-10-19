import { useEffect, useRef, useState } from "react";
import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Square, Volume2 } from "lucide-react";
import explainAudioError from "@/src/functions/frontend/explain-audio-error";

type Props = {
    /**
     * The speech model picked in the form, saved or not.
     */
    model_id: number;
    voice?: string;
};

/**
 * Plays a short sample in the form's speech model and voice, before
 * they're saved (`api/admin/harness/preview-voice`, streamed). Stops when
 * clicked again or when the pick changes.
 */
export default function HarnessVoicePreview({ model_id, voice }: Props) {
    const [state, setState] = useState<"idle" | "loading" | "playing">("idle");
    const [error, setError] = useState<string>();
    const audio_ref = useRef<HTMLAudioElement | null>(null);

    function stop() {
        const audio = audio_ref.current;

        if (audio) {
            audio.onerror = null;
            audio.pause();
            audio.removeAttribute("src");
            audio.load();
        }

        setState("idle");
    }

    useEffect(() => {
        setError(undefined);
        return stop;
    }, [model_id, voice]);

    function play() {
        stop();
        setError(undefined);
        setState("loading");

        const src = `/api/admin/harness/preview-voice?${new URLSearchParams({
            model_id: String(model_id),
            ...(voice ? { voice } : {}),
        })}`;
        const audio = audio_ref.current || new Audio();

        audio_ref.current = audio;
        audio.onplaying = () => setState("playing");
        audio.onended = () => setState("idle");
        audio.onerror = () => {
            setState("idle");
            explainAudioError({ src, fallback: "Couldn't play the sample. Try again." }).then(setError);
        };
        audio.src = src;
        audio.play().catch(() => {});
    }

    const playing = state == "playing";

    return (
        <Row className="gap-2! flex-nowrap items-center">
            <Button
                title={playing ? "Stop the sample" : "Hear a short sample in this voice"}
                type="button"
                variant="ghost"
                color="gray"
                size="small"
                loading={state == "loading"}
                beforeIcon={
                    playing ? <Square size={13} fill="currentColor" /> : <Volume2 size={15} />
                }
                onClick={playing ? stop : play}
            >
                {playing ? "Stop" : "Hear a sample"}
            </Button>
            {error ? (
                <Span role="status" className="text-[13px] leading-[18px] text-ink-secondary">
                    {error}
                </Span>
            ) : null}
        </Row>
    );
}
