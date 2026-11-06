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
    /\b(?:when|once) (?:it|that|the (?:run|scan|search|check))(?:'|’)?s? (?:back|done|finished|complete)\b/i,
];

/**
 * True when the answer says work is under way beyond it or that a report
 * will follow (`UnderWayPatterns`). Only a started run makes that true,
 * so a reply that says it without one is sent back (`reviewBotReply`).
 */
export default function claimsWorkUnderWay({ text }: Params) {
    return UnderWayPatterns.some((pattern) => pattern.test(text));
}
