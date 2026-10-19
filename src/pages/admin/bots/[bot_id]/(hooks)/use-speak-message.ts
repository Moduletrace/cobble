import { useEffect, useRef, useState } from "react";
import explainAudioError from "@/src/functions/frontend/explain-audio-error";

export type SpeakMessageState = "idle" | "loading" | "playing";

export type SpeakMessage = {
    /**
     * The bot has a speech model here; the play buttons are disabled
     * without one.
     */
    enabled: boolean;
    /**
     * The message being fetched or played, if any.
     */
    message_id: number | null;
    state: SpeakMessageState;
    error?: { message_id: number; text: string };
    /**
     * Plays the message, or stops it when it's the one playing. Starting
     * one stops any other.
     */
    toggle: (params: { message_id: number }) => void;
};

/**
 * The conversation's read-aloud: one audio element for every message,
 * pointed at `api/admin/bots/speak-message`, which streams, so playing
 * starts before the whole message is spoken. Stopping drops the stream.
 */
export default function useSpeakMessage({ enabled }: { enabled: boolean }): SpeakMessage {
    const [message_id, setMessageId] = useState<number | null>(null);
    const [state, setState] = useState<SpeakMessageState>("idle");
    const [error, setError] = useState<SpeakMessage["error"]>();
    const audio_ref = useRef<HTMLAudioElement | null>(null);
    const current_ref = useRef<number | null>(null);

    useEffect(() => () => release(), []);

    function release() {
        const audio = audio_ref.current;

        if (!audio) return;

        audio.pause();
        audio.removeAttribute("src");
        audio.load();
    }

    function reset() {
        current_ref.current = null;
        setMessageId(null);
        setState("idle");
    }

    function stop() {
        release();
        reset();
    }

    function play({ message_id }: { message_id: number }) {
        stop();
        setError(undefined);
        current_ref.current = message_id;
        setMessageId(message_id);
        setState("loading");

        const src = `/api/admin/bots/speak-message?message_id=${message_id}`;
        const audio = audio_ref.current || new Audio();
        const isCurrent = () => current_ref.current == message_id;

        audio_ref.current = audio;
        audio.onplaying = () => {
            if (isCurrent()) setState("playing");
        };
        audio.onended = () => {
            if (isCurrent()) reset();
        };
        audio.onerror = () => {
            if (!isCurrent()) return;

            reset();
            explainAudioError({ src, fallback: "Couldn't read it aloud. Try again." }).then((text) => {
                setError({ message_id, text });
            });
        };
        audio.src = src;
        audio.play().catch(() => {});
    }

    function toggle({ message_id: id }: { message_id: number }) {
        if (current_ref.current == id) {
            stop();
            return;
        }

        play({ message_id: id });
    }

    return { enabled, message_id, state, error, toggle };
}
