import { BotJobKinds } from "@/src/dict/bot-queue-dict";
import type { MessageDetails } from "@/src/types";
import formatDuration from "@/src/utils/format-duration";
import providerLabel from "./provider-label";

type Params = {
    details: MessageDetails;
};

export type MessageDetailsFacts = {
    /**
     * Every provider name that answered, in the order they first did.
     */
    providers: string[];
    /**
     * Every model name that answered, in the order they first did.
     */
    model_names: string[];
    /**
     * When the earliest call or failure was made, so each reads as an
     * offset from it.
     */
    first_at: number;
    job_kind: string;
    job_took: string;
};

/**
 * What a message's details say at a glance, worked out once so the modal
 * and the copy of it never disagree: the providers and models behind the
 * message, when its first call was made, and how the run reads.
 */
export default function messageDetailsFacts({ details }: Params): MessageDetailsFacts {
    const { models, calls, failures, job } = details;

    return {
        providers: [
            ...new Set(models.map((model) => providerLabel({ name: model.provider_name, kind: model.provider_kind }))),
        ],
        model_names: [...new Set(models.map((model) => model.model_name || model.model_slug || "Unknown model"))],
        first_at: Math.min(
            ...[calls[0]?.created_at, failures[0]?.created_at].filter((at): at is number => Boolean(at)),
            Number.MAX_SAFE_INTEGER,
        ),
        job_kind: BotJobKinds.find((kind) => kind.value == job?.kind)?.title || job?.kind || "",
        job_took:
            job?.started_at && job.finished_at ? formatDuration({ ms: job.finished_at - job.started_at }) : "",
    };
}
