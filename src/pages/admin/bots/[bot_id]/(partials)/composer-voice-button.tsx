import Button from "@moduletrace/twui/layout/Button";
import Row from "@moduletrace/twui/layout/Row";
import Span from "@moduletrace/twui/layout/Span";
import { Mic, Square } from "lucide-react";
import type { VoiceRecorderState } from "../(hooks)/use-voice-recorder";

const UnavailableTitle =
    "Dictation needs a transcription model. A super admin can pick one in Settings, under Models.";

type Props = {
    state: VoiceRecorderState;
    elapsed_ms: number;
    error?: string;
    /**
     * No transcription model for the bot here: shown disabled, saying so.
     */
    unavailable?: boolean;
    disabled?: boolean;
    onStart: () => void;
    onStop: () => void;
};

/**
 * The composer's dictation button: a mic, a stop square with the time
 * while recording, a spinner while the recording is turned into text.
 * Its title says why it last failed, or that it needs a model.
 */
export default function ComposerVoiceButton({
    state,
    elapsed_ms,
    error,
    unavailable,
    disabled,
    onStart,
    onStop,
}: Props) {
    const recording = state == "recording";
    const seconds = Math.floor(elapsed_ms / 1000);

    return (
        <Row className="shrink-0 gap-1.5! flex-nowrap items-center">
            {recording ? (
                <Span className="text-xs tabular-nums text-ink-secondary" aria-live="off">
                    {Math.floor(seconds / 60)}:{String(seconds % 60).padStart(2, "0")}
                </Span>
            ) : null}
            <Button
                title={
                    unavailable
                        ? UnavailableTitle
                        : recording
                          ? "Stop and write it out (Esc cancels)"
                          : error || "Dictate"
                }
                aria-label={recording ? "Stop dictating" : "Dictate"}
                aria-invalid={error ? true : undefined}
                aria-pressed={recording}
                type="button"
                variant="ghost"
                color="text"
                disabled={disabled || unavailable}
                loading={state == "transcribing"}
                loadingIconSize="smaller"
                onClick={recording ? onStop : onStart}
                className="shrink-0 p-1! -mx-1 my-1 text-ink dark:text-ink rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
            >
                {recording ? (
                    <Square size={14} aria-hidden fill="currentColor" />
                ) : (
                    <Mic size={16} aria-hidden />
                )}
            </Button>
        </Row>
    );
}
