import { describe, expect, test } from "bun:test";
import userAskedQuote from "./user-asked-quote";

/**
 * A crew change is only done when the user asked for it: the tool carries
 * their own words, and this decides whether they are really theirs.
 */
describe("userAskedQuote", () => {
    test("finds the words in what the user wrote", () => {
        expect(userAskedQuote({ quote: "add the SEO bot to Retail", texts: ["Can you add the SEO bot to Retail?"] })).toBe(
            true,
        );
    });

    test("ignores case, markdown and the way prose is typed", () => {
        expect(
            userAskedQuote({
                quote: "Create a bot called *Nigerian Law Expert*",
                texts: ["ok, **create a bot called Nigerian Law Expert** and put it in Legal"],
            }),
        ).toBe(true);
    });

    test("reads curly quotes and dashes as their plain forms", () => {
        expect(
            userAskedQuote({
                quote: 'Give "Researcher" a computer - the main one',
                texts: ["Give \u201cResearcher\u201d a computer \u2014 the main one"],
            }),
        ).toBe(true);
    });

    test("sees a quote that wraps a line break", () => {
        expect(
            userAskedQuote({
                quote: "remove the designer from the Launch workspace",
                texts: ["please remove the designer\nfrom the Launch workspace"],
            }),
        ).toBe(true);
    });

    test("looks through every message in the conversation", () => {
        expect(
            userAskedQuote({
                quote: "make the SEO Expert the retail admin",
                texts: ["Here is the plan.", "Yes: make the SEO Expert the retail admin."],
            }),
        ).toBe(true);
    });

    test("a quote the user never wrote is refused", () => {
        expect(userAskedQuote({ quote: "add the SEO bot to Retail", texts: ["Add the writer bot to Retail."] })).toBe(
            false,
        );
    });

    test("a short overlap that happens to appear is not a request", () => {
        expect(userAskedQuote({ quote: "yes", texts: ["Yes, go ahead."] })).toBe(false);
        expect(userAskedQuote({ quote: "do it", texts: ["Please do it."] })).toBe(false);
        expect(userAskedQuote({ quote: "   ", texts: ["anything"] })).toBe(false);
        expect(
            userAskedQuote({
                quote: "add the bot",
                texts: ["Please add the bot to the retail workspace when you can."],
            }),
        ).toBe(false);
    });

    test("a sentence lifted from the bot's own message is not the user's", () => {
        expect(
            userAskedQuote({
                quote: "I'll add the SEO Expert to your Retail workspace now.",
                texts: ["Ok, go ahead with that."],
            }),
        ).toBe(false);
    });

    test("no messages at all matches nothing", () => {
        expect(userAskedQuote({ quote: "create a workspace called Legal", texts: [] })).toBe(false);
    });
});
