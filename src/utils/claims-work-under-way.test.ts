import { describe, expect, test } from "bun:test";
import claimsWorkUnderWay from "./claims-work-under-way";

describe("claimsWorkUnderWay", () => {
    test("catches the lines replies wrote before made-up results", () => {
        for (const text of [
            "I'm browsing the open contests on your account now, filtering for ones that fit your style.",
            "I'm scanning the open contests now with a fresh list. When it's back, I'll create proper tasks.",
            "I'm running the scan for real now: one pass over the open-contest listing.",
            "I'm reading contest #1's full brief in the background right now.",
            "Creating tasks now. Report follows in the next message.",
            "I'll report back with the links once that run completes.",
            "I’m checking your inbox now.",
            "I'll drive the browser to ideogram.ai directly and see what's there.",
            "I'll open the contest page now.",
            "I'll go ahead and check the tab right away.",
            "What I sent @SEO Expert: a full brief, with the scope and the ground rules.",
            "I've passed the brief on to [bot:6] SEO Expert.",
        ]) {
            expect(claimsWorkUnderWay({ text })).toBe(true);
        }
    });

    test("leaves answers that only report or offer alone", () => {
        for (const text of [
            "Done. Task #20 is cancelled with a note.",
            "Want me to start on contest 2 now?",
            "I'm sorry, that contest isn't open any more.",
            "I checked the board: 3 web design contests are open.",
            "Right now there are 147 open contests.",
            "I'll keep that in mind going forward.",
            "Want me to check it now? I'll wait for your go-ahead.",
            "I'll use the navy palette in the next round.",
            "I sent the invoice to accounting last week.",
            "The report was sent to the team on Monday.",
        ]) {
            expect(claimsWorkUnderWay({ text })).toBe(false);
        }
    });
});
