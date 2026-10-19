type Params = {
    text: string;
};

const MissingAudio =
    /(provide|upload|share|attach|send)\b.{0,40}\baudio|can(?:'|’)?t (?:transcribe|hear|access|listen)|cannot (?:transcribe|hear|access|listen)|no audio|without (?:the |an |any )?audio|didn(?:'|’)?t (?:receive|get) (?:the |an |any )?audio/i;

/**
 * Whether a chat model's "transcript" is really it saying it got no audio.
 * Some providers list audio input for a model but drop the audio.
 */
export default function looksLikeMissingAudio({ text }: Params) {
    return text.length < 300 && MissingAudio.test(text);
}
