import { useEffect, useRef, useState } from "react";
import { AppData } from "@/src/data/app-data";

export type VoiceRecorderState = "idle" | "recording" | "transcribing";

type Params = {
    /**
     * Gets the finished recording. The hook stays `transcribing` until it
     * resolves.
     */
    onRecorded: (params: { audio: Blob }) => Promise<void>;
};

/**
 * Types the browser may record in, best first. Safari only has mp4.
 */
const RecordingTypes = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];

/**
 * Records the microphone for the composer's dictation. Stops on its own
 * after `AppData.ComposerVoiceMaxMs`; Escape cancels. The mic is released whenever
 * recording ends, and on unmount. `supported` is false without a secure
 * context or `MediaRecorder`.
 */
export default function useVoiceRecorder({ onRecorded }: Params) {
    const [state, setState] = useState<VoiceRecorderState>("idle");
    const [elapsed_ms, setElapsedMs] = useState(0);
    const [error, setError] = useState<string>();
    const [supported, setSupported] = useState(false);
    const recorder_ref = useRef<MediaRecorder | null>(null);
    const cancelled_ref = useRef(false);
    const on_recorded_ref = useRef(onRecorded);

    on_recorded_ref.current = onRecorded;

    useEffect(() => {
        setSupported(
            typeof MediaRecorder != "undefined" &&
                Boolean(navigator.mediaDevices?.getUserMedia),
        );

        return () => {
            cancelled_ref.current = true;
            recorder_ref.current?.stop();
        };
    }, []);

    useEffect(() => {
        if (state != "recording") return;

        const started_at = Date.now();
        const timer = setInterval(() => {
            const ms = Date.now() - started_at;

            setElapsedMs(ms);

            if (ms >= AppData.ComposerVoiceMaxMs) stop();
        }, 250);

        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key != "Escape") return;

            e.preventDefault();
            cancel();
        };

        window.addEventListener("keydown", onKeyDown);

        return () => {
            clearInterval(timer);
            window.removeEventListener("keydown", onKeyDown);
        };
    }, [state]);

    async function start() {
        if (state != "idle") return;

        setError(undefined);
        setElapsedMs(0);

        let stream: MediaStream;

        try {
            stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        } catch {
            setError("Microphone blocked. Allow it in the browser's site settings.");
            return;
        }

        const type = RecordingTypes.find((t) => MediaRecorder.isTypeSupported(t));
        const recorder = new MediaRecorder(stream, type ? { mimeType: type } : undefined);
        const chunks: Blob[] = [];

        cancelled_ref.current = false;
        recorder.ondataavailable = (e) => {
            if (e.data.size) chunks.push(e.data);
        };
        recorder.onstop = async () => {
            stream.getTracks().forEach((track) => track.stop());
            recorder_ref.current = null;

            if (cancelled_ref.current || !chunks.length) {
                setState("idle");
                return;
            }

            setState("transcribing");

            /**
             * The bare type, without `;codecs=`, so it reads as a plain
             * data URL.
             */
            const audio = new Blob(chunks, {
                type: (recorder.mimeType || type || "audio/webm").split(";")[0],
            });

            await on_recorded_ref.current({ audio }).catch(() => {});
            setState("idle");
        };

        recorder_ref.current = recorder;
        recorder.start();
        setState("recording");
    }

    function stop() {
        recorder_ref.current?.stop();
    }

    function cancel() {
        cancelled_ref.current = true;
        recorder_ref.current?.stop();
    }

    return { state, elapsed_ms, error, setError, supported, start, stop, cancel };
}
