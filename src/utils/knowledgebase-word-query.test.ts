import { describe, expect, test } from "bun:test";
import knowledgebaseWordQuery from "./knowledgebase-word-query";

describe("knowledgebaseWordQuery", () => {
    test("matches any word, the longer ones as prefixes", () => {
        expect(knowledgebaseWordQuery({ query: "How many refund days?" }).match).toBe(
            `"how" OR "many"* OR "refund"* OR "days"*`,
        );
    });

    test("keeps accented and non-Latin words whole", () => {
        expect(knowledgebaseWordQuery({ query: "Congés payés" }).match).toBe(`"congés"* OR "payés"*`);
        expect(knowledgebaseWordQuery({ query: "Сколько дней отпуска?" }).match).toBe(
            `"сколько"* OR "дней"* OR "отпуска"*`,
        );
        expect(knowledgebaseWordQuery({ query: "كم يوم إجازة" }).match).toBe(`"كم" OR "يوم" OR "إجازة"*`);
    });

    test("drops one-letter words, repeats and punctuation that could break the match", () => {
        expect(knowledgebaseWordQuery({ query: `a "leave" leave OR NEAR(x)` }).match).toBe(
            `"leave"* OR "or" OR "near"*`,
        );
    });

    test("splits text written without spaces into pairs for the fallback", () => {
        const result = knowledgebaseWordQuery({ query: "年假有几天" });

        expect(result.match).toBeNull();
        expect(result.like_terms).toEqual(["年假", "假有", "有几", "几天"]);
    });

    test("has nothing to search for in punctuation alone", () => {
        expect(knowledgebaseWordQuery({ query: "?!" })).toEqual({ match: null, like_terms: [] });
    });
});
