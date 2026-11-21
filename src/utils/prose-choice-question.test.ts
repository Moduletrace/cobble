import { describe, expect, test } from "bun:test";
import proseChoiceQuestion from "./prose-choice-question";

describe("proseChoiceQuestion", () => {
    test("finds the numbered choice from session 133", () => {
        const text = `I need a few things to start the filing.

**What would you like to do?**
1. **Provide the details now** (I'll start name reservation immediately)
2. **Get a template** to fill and send back
3. **Use an accredited CAC agent** you already work with

Let me know your name choices and preferred approach.`;

        expect(proseChoiceQuestion({ text })).toEqual({
            question: "What would you like to do?",
            options: 3,
        });
    });

    test("finds the Option A and B list", () => {
        const text = `The plan is already complete at a planning level.

Which would you like?
- **Option A:** Flesh out Steps 3-6 with more operational detail
- **Option B:** Pause planning and execute Step 2 later`;

        expect(proseChoiceQuestion({ text })?.options).toBe(2);
    });

    test("leaves a plain follow-up question alone", () => {
        expect(proseChoiceQuestion({ text: "The audit is done. Want me to send it?" })).toBeNull();
    });

    test("leaves a section heading over facts alone", () => {
        const text = `What's included?
- Hosting for a year
- A domain name`;

        expect(proseChoiceQuestion({ text })).toBeNull();
    });

    test("ignores a question and list inside a code fence", () => {
        const text = "Example config:\n```\nWhich mode?\n- fast\n- safe\n```";

        expect(proseChoiceQuestion({ text })).toBeNull();
    });

    test("needs a choice cue in the question", () => {
        const text = `What changed?
- The header
- The footer`;

        expect(proseChoiceQuestion({ text })).toBeNull();
    });
});