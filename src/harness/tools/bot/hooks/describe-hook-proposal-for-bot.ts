import type { HookProposalView } from "@/src/types";
import hookProposalRef from "@/src/utils/hook-proposal-ref";

type Params = {
    view: HookProposalView;
};

/**
 * What a bot is told once it proposed a hook: the ref to put in its
 * reply, and what the card shows (worked out by the app), so it tells the
 * user the same thing the card does.
 */
export default function describeHookProposalForBot({ view }: Params) {
    const ref = hookProposalRef({ id: view.id });
    const shows = view.details
        .filter((detail) => !detail.block)
        .map((detail) => `${detail.label}: ${detail.value}`)
        .join("; ");

    return [
        `Proposed as ${ref}. Nothing is saved yet: the user confirms or rejects it from the card ${ref} becomes in your reply, so put ${ref} in your reply.`,
        `The card shows ${shows}${view.details.some((detail) => detail.block) ? ", and the whole brief" : ""}.`,
        view.makes_url
            ? `Once confirmed, the card shows the user its URL, once. You never see it: never ask for it. Tell them to give it to the service that will call it, and that they can require signed calls from the Hooks menu.`
            : "",
        `Don't say it's done: the user's next message says whether they confirmed it and what happened.`,
    ]
        .filter(Boolean)
        .join("\n");
}
