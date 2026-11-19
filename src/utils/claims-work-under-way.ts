type Params = {
    text: string;
};

/**
 * "I'm" and "I am": a weaker model writes the long form, and "I am
 * starting a task to do that." went out with no run behind it while every
 * pattern here read the contraction alone.
 */
const IAm = "(?:i(?:'|’)?m|i am)";

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
    new RegExp(
        `\\b${IAm}\\s+(?:now\\s+|just\\s+)?(?:starting|beginning|kicking off|launching|queueing|queuing|firing off|spinning up)\\b[^.!?\\n]{0,120}\\b(?:run|task|job|work|scan|audit|recon|build|pass)\\b`,
        "i",
    ),
    new RegExp(`\\bI(?:'|’)ve\\s+(?:now\\s+|just\\s+)?(?:started|begun|kicked off|launched|queued|fired off|spun up)\\b`, "i"),
    new RegExp(`\\b${IAm}\\s+(?:now\\s+|just\\s+)?(?:starting|beginning|kicking off)\\s+(?:it|this|that)\\b`, "i"),
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
    new RegExp(`\\b${IAm} (?:going|about) to ${WorkVerb}\\b`, "i"),
    /**
     * "I am checking the inbox now." The wide "I'm ... ing ... now" above
     * reads the whole reply, so adding "I am" there faulted a table cell
     * quoting a line ("I am telling you the same day", with "is now a
     * follow-up" further along). Read a sentence at a time, only its own
     * opening counts.
     */
    new RegExp(`^\\s*${IAm}\\s+(?:now\\s+)?[a-z]+ing\\b[^.!?\\n]{0,160}\\bnow\\b`, "i"),
    /**
     * Work named as happening this moment rather than promised: "Starting
     * the conversion run now.", written after the app sent the reply back
     * for promising it, and "I'm reading the four digests, then I'll
     * build one sample". The sentence has to say it is happening, with a
     * closer, so "Starting a task on a busy computer waits behind the open
     * run" explains the app instead of claiming a run.
     *
     * The noun is the work, whatever the bot calls it: "Starting the
     * actual Canva Dream Lab generation now" went out after a review
     * rewrite, with no `start_task`. `generation` was not in the old list,
     * and four words sat between "the" and it, so both limits missed it.
     * A colon in the brief ("generation now with the brief: …") is not the
     * end of the claim.
     */
    new RegExp(
        `^\\s*(?:starting|beginning|kicking off|launching)\\s+(?:(?:the|a|an|this|that|my|both)\\s+)?(?:[\\w%-]+\\s+){0,8}(?:run|job|task|work|scan|audit|build|conversion|review|pass|generation|render|export|import)\\b(?:[^.!?\\n]|:(?!\\s)){0,80}\\b(?:now|right away|immediately|for you|as we speak)\\b`,
        "i",
    ),
    new RegExp(
        `^\\s*${IAm}\\s+(?:now\\s+|just\\s+)?${WorkVerb}ing\\b[^.!?\\n]{0,200}\\b(?:then\\s+)?(?:i(?:'|’)ll|i will)\\b`,
        "i",
    ),
    /**
     * "Now generating the single centered 6% signpost hero using the image
     * generation tool." Production, session 75 message 951: the run deleted
     * the old files, wrote that, and called no image tool. The sentence
     * opens with "Now generating", which none of the patterns above read:
     * the promise patterns open on "starting", and the under-way ones need
     * "I'm".
     */
    /^\s*(?:now\s+)?(?:generating|rendering|creating|building|designing|drafting|editing|writing|importing|exporting|uploading|downloading|processing|compiling|installing|deploying|testing|checking|reading|reviewing|scanning|searching|analy[sz]ing|working|running|fixing|updating|converting)\b[^.!?\n]{0,160}\b(?:now|right away|immediately|as we speak)\b/i,
    /^\s*now\s+(?:generating|rendering|creating|building|designing|drafting|editing|writing|importing|exporting|uploading|downloading|processing|compiling|installing|deploying|testing|checking|reading|reviewing|scanning|searching|analy[sz]ing|working|running|fixing|updating|converting)\b/i,
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
