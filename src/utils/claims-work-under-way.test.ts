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
            /**
             * The reply that started nothing: it said the run was under
             * way, then wrote its own app record line to look like the
             * tools had run. Caught by the app, not by the user.
             */
            "I'm starting the hydration work as a single-route proof rather than a shell-wide rewrite, on [computer:1] - with the production numbers as the target. I'll say why I scoped it that way once the run reports.",
            "I've started the hydration work on computer 1. I'll report when it lands.",
            "I'm starting the recon run for task #44.",
            "I've kicked off the run on computer 1.",
            "I'm spinning up the build now.",
            "I'm starting it now.",
            "Starting it now.",
            /**
             * The shapes that got past the list above: "Let me check" and
             * "I'll connect and inspect" name work the reply never did,
             * without the "now" or the "and see" it looked for.
             */
            "Let me check the account settings and see what's there.",
            "Let me take a look at the export.",
            "I'll take a look at the export.",
            "I will inspect the table.",
            "Then I'll check the logs.",
            "Next, I'll pull the list.",
            "And then I'll write both articles.",
            "I'm going to check the logs.",
            "I'm about to read the export.",
            "Once I have it, I'll update the workspace context with what I learn.",
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
            "I'll start with what changed, then the numbers.",
            "I'm starting to think the brief is wrong.",
            "I started the invoice last week.",
            "Task #48 is doing, nothing is running yet.",
        ]) {
            expect(claimsWorkUnderWay({ text })).toBe(false);
        }
    });

    /**
     * Two replies that went out with nothing running and the user left
     * waiting, both from the same conversation: the first promised to work
     * the articles, the second to check their format, and neither called a
     * tool. The lines they have to stay silent on come from the same
     * export: every one of those is an answer waiting on the user, which
     * faulting would send back as a lie.
     */
    test("catches the replies that promised work and started nothing", () => {
        for (const text of [
            "Connection details received. I'll connect and inspect the `articles` table first, then check for existing slugs, then write both articles as drafts.",
            "You're right to flag that. Let me check what format the existing articles use in the database, then convert if needed.",
            "I'll re-run the PageSpeed scan now.",
        ]) {
            expect(claimsWorkUnderWay({ text })).toBe(true);
        }

        for (const text of [
            "I'll carry on when you ask me to.",
            "Tell me which site to audit and I'll run it and send back a single markdown report.",
            "If you upload the logo file as a [file:12] I'll set it as the workspace picture right away.",
            "Once you answer I'll run the write and verify it.",
            "Once the export is ready I'll check it.",
            "It's on my list; I'll start when you say.",
            "or name the piece you want changed and I'll take it from there.",
            "I'll wait for your answers before touching anything further.",
            "Let me know which export you mean and I'll check it.",
            "I'll note the preference in my memory of you.",
            "I'll check with you before I change anything.",
            "If it's still not done shortly, the honest move is Stop it and I'll run a leaner version.",
            "Point me at the spec, and I'll run the full build-and-write in one go.",
            "say yes and I'll run it.",
            "If you want the SQL inserts for the two rows, I'll generate them and you can run them.",
            "First the counts, then I'll pull the list.",
        ]) {
            expect(claimsWorkUnderWay({ text })).toBe(false);
        }
    });
});
