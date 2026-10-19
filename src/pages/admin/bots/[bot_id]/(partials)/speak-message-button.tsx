import { useContext } from "react";
import Button from "@moduletrace/twui/layout/Button";
import { Square, Volume2 } from "lucide-react";
import { SpeakMessageContext } from "../(data)/speak-message-context";

const UnavailableTitle =
    "Reading aloud needs a speech model. A super admin can pick one in Settings, under Models.";

type Props = {
    message_id: number;
};

/**
 * Reads a bot message aloud with its speech model, or stops it. Its title
 * says why it last failed. Disabled, saying so, while speech has no model.
 */
export default function SpeakMessageButton({ message_id }: Props) {
    const speak = useContext(SpeakMessageContext);
    const active = speak.message_id == message_id;
    const playing = active && speak.state == "playing";
    const error = speak.error?.message_id == message_id ? speak.error.text : undefined;

    return (
        <Button
            title={
                !speak.enabled
                    ? UnavailableTitle
                    : playing
                      ? "Stop"
                      : error || "Read aloud"
            }
            aria-label={playing ? "Stop reading" : "Read aloud"}
            aria-invalid={error ? true : undefined}
            type="button"
            disabled={!speak.enabled}
            variant="ghost"
            color="text"
            loading={active && speak.state == "loading"}
            loadingIconSize="smaller"
            onClick={() => speak.toggle({ message_id })}
            className="shrink-0 p-1! -mx-1 text-ink-secondary dark:text-ink-secondary hover:text-ink rounded-default-xs focus-visible:ring-2 focus-visible:ring-ink"
        >
            {playing ? (
                <Square size={12} aria-hidden fill="currentColor" />
            ) : (
                <Volume2 size={14} aria-hidden />
            )}
        </Button>
    );
}
