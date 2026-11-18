type Params = {
    text: string;
};

/**
 * How an answer says work is going on after it, or that a report will
 * follow: the line a reply writes once it started a run ("I'm browsing
 * the open contests now. I'll report back."). Written without starting
 * one, it was followed by results made up on the spot.
 */
const UnderWayPatterns = [
    /\bI(?:'|’)m\s+(?:now\s+)?[a-z]+ing\b[^.!?\n]{0,160}\bnow\b/i,
    /\bin the background\b/i,
    /\bI(?:'|’)ll\s+(?:report back|get back to you|let you know when|bring (?:you |it )?back|report (?:the|my) (?:results?|findings))/i,
    /\b(?:report|results?|details|update)\s+(?:follows|will follow|to follow|coming)\b/i,
    /\bin (?:my|the|a) (?:next|following) message\b/i,
    /\b(?:when|once) (?:it|that|the (?:run|job|task|scan|search|check|work))(?:'|’)?s?\s+(?:back|done|finished|complete|reports|lands|returns|comes in|comes back)\b/i,
    /**
     * "I'll drive the browser to ideogram.ai directly and see what's
     * there." A dot inside a word (a domain, a file name) doesn't end the
     * sentence.
     */
    /\bI(?:'|’)ll\s+(?:now\s+|go\s+ahead\s+and\s+)?(?:drive|open|go|head|browse|navigate|check|look|run|start|search|scan|dig|pull|grab|fetch|try|use)\b(?:[^.!?\n]|\.(?=\S)){0,160}\b(?:and see|see what|right away|straight away|directly|now)\b/i,
    /**
     * "What I sent @SEO Expert", "I've passed the brief on to [bot:6]": a
     * request claimed as made. Only `ask_bot` makes one, so the app's
     * record decides whether it's true.
     */
    /\b(?:sent|passed|forwarded|handed)\b[^.!?\n]{0,80}(?:@[a-z0-9_-]+|\[bot:\d+\])/i,
    /**
     * "I'm starting the hydration work on computer 1", "I've kicked off
     * the run": a run claimed as started, without the "now" or the
     * promised report the patterns above need. Only `start_task` starts
     * one, so the app's record decides whether it's true.
     */
    /\bI(?:'|’)?m\s+(?:now\s+|just\s+)?(?:starting|beginning|kicking off|launching|queueing|queuing|firing off|spinning up)\b[^.!?\n]{0,120}\b(?:run|task|job|work|scan|audit|recon|build|pass)\b/i,
    /\bI(?:'|’)ve\s+(?:now\s+|just\s+)?(?:started|begun|kicked off|launched|queued|fired off|spun up)\b/i,
    /\bI(?:'|’)?m\s+(?:now\s+|just\s+)?(?:starting|beginning|kicking off)\s+(?:it|this|that)\b/i,
    /(?:^|[.!?\n]\s*)(?:starting|beginning|kicking off)\s+(?:it|that|the (?:run|job|task|work|scan|audit|build))\b/i,
];

/**
 * The work a promise is about. Only words for work: "I'll keep that in
 * mind", "I'll use the navy palette" and "I'll take it from there" are an
 * answer talking about itself, not work that never starts.
 */
const WorkVerb =
    "(?:re-)?(?:check|look|see|verify|inspect|connect|query|convert|read|open|run|pull|grab|fetch|write|draft|update|fix|review|scan|search|dig|trace|test|build|deploy|export|import|compare|audit|generate|create)";

/**
 * A promise in one of its shapes, read a sentence at a time:
 * "Let me check what format the articles use, then convert if needed"
 * and "I'll connect and inspect the table first, then write both
 * articles" both went out with no run behind them, and `UnderWayPatterns`
 * passed them: `connect` was not one of its verbs, and neither sentence
 * had the "now" or the "and see" its first verb needed.
 *
 * Only the sentence's own opening counts, and only when the whole
 * sentence is the commitment. "Point me at the spec and I'll run it" and
 * "if it's still stuck, Stop it and I'll run a leaner version" are the
 * user's to unlock, and flagging them would take the offer away from the
 * answer that was waiting exactly as it should.
 */
const PromisePatterns = [
    new RegExp(`^\\s*let me (?:${WorkVerb}|take a (?:quick )?look|have a (?:quick )?look)\\b`, "i"),
    new RegExp(
        `^\\s*(?:and\\s+)?(?:then|next|after that|first)?,?\\s*I(?:(?:'|’)ll| will) (?:also |now |just )?(?:${WorkVerb}|take a (?:quick )?look|have a (?:quick )?look)\\b`,
        "i",
    ),
    new RegExp(
        `^\\s*(?:once|when|after|as soon as)\\b[^,.]{0,80},\\s*(?:then\\s+)?I(?:(?:'|’)ll| will) (?:also |now |just )?${WorkVerb}\\b`,
        "i",
    ),
    new RegExp(`\\bI(?:'|’)?m (?:going|about) to ${WorkVerb}\\b`, "i"),
];

/**
 * Sentences where a promise is the user's to unlock, so nothing is
 * missing: "once you answer I'll run it", "say the word and I'll check",
 * "I'll wait for your answers". Sent back as a lie, each of these was an
 * answer waiting on the user exactly as it should.
 */
const GatedPatterns = [
    /\b(?:if|when|once|whenever|after|as soon as|unless) you\b/i,
    /\bonce (?:it|that|this|they|the)\b/i,
    /\b(?:tell|show|give|send) me\b/i,
    /\blet me know\b/i,
    /\bsay the word\b/i,
    /\bgo-ahead\b/i,
    /\bwaiting for (?:you|your)\b/i,
    /\bask me\b/i,
    /\bwhichever you\b/i,
    /\bcheck with you\b/i,
];

/**
 * True when the answer says work is under way beyond it or that a report
 * will follow (`UnderWayPatterns`), or promises work it is not doing
 * (`PromisePatterns`). Only a started run makes that true, so a reply that
 * says it without one is sent back (`reviewBotReply`).
 */
export default function claimsWorkUnderWay({ text }: Params) {
    if (UnderWayPatterns.some((pattern) => pattern.test(text))) return true;

    return text.split(/(?<=[.!?])\s+|\n/).some((sentence) => {
        if (GatedPatterns.some((pattern) => pattern.test(sentence))) return false;

        return PromisePatterns.some((pattern) => pattern.test(sentence));
    });
}
