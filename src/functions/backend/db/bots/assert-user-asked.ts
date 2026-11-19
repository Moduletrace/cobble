import AppError from "@/src/utils/app-error";
import userAskedQuote from "@/src/utils/user-asked-quote";
import grabUserMessageTexts from "./grab-user-message-texts";

type Params = {
    /**
     * The conversation the run answers. Missing means the run is unattended,
     * so the call is refused rather than skipped.
     */
    session_id?: number | string | null;
    /**
     * What the tool says the user asked for, in their own words.
     */
    because: string;
    /**
     * What the tool would do, in the sentence it is refused with.
     */
    action: string;
};

/**
 * The gate every crew-changing tool makes before it acts: the quote has to
 * be a span of a human message in this conversation. A missing session is
 * a refusal, since skipping it would let an unattended run pass any quote.
 */
export default async function assertUserAsked({ session_id, because, action }: Params) {
    if (!session_id) {
        throw new AppError(
            `You can only ${action} in a conversation with the user, once they asked for it there. This run has no such conversation, so nothing was changed.`,
        );
    }

    const texts = await grabUserMessageTexts({ session_id });

    if (userAskedQuote({ quote: because, texts })) return;

    throw new AppError(
        texts.length
            ? `You can only ${action} when the user asked for it in this conversation, and the quote you gave isn't in anything they wrote here. If it still needs doing, ask them first with ask_user, then do it once they say yes.`
            : `You can only ${action} when the user asked for it, and they haven't written anything in this conversation. Ask first with ask_user, then do it once they say yes.`,
    );
}
