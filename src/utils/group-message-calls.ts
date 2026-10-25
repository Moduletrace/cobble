import type { MessageDetailsCall, MessageDetailsModel } from "@/src/types";

type Params = {
    calls: MessageDetailsCall[];
};

/**
 * A message's calls summed per provider, model and harness, busiest
 * first: the "Models" list of its details modal. A call whose model or
 * provider was never recorded is grouped with the others like it.
 */
export default function groupMessageCalls({ calls }: Params): MessageDetailsModel[] {
    const groups = new Map<string, MessageDetailsModel>();

    for (const call of calls) {
        const key = [call.harness, call.provider_id ?? call.provider_name ?? "", call.model_slug ?? ""].join("\u0000");
        const group = groups.get(key) || {
            harness: call.harness,
            provider_name: call.provider_name,
            provider_kind: call.provider_kind,
            model_slug: call.model_slug,
            model_name: call.model_name,
            settings: call.settings,
            prompt_tokens: 0,
            completion_tokens: 0,
            total_tokens: 0,
            calls: 0,
        };

        group.prompt_tokens += call.prompt_tokens;
        group.completion_tokens += call.completion_tokens;
        group.total_tokens = group.prompt_tokens + group.completion_tokens;
        group.calls += 1;
        group.settings = call.settings || group.settings;

        if (typeof call.cost == "number" && call.cost > 0) {
            group.cost = (group.cost || 0) + call.cost;
        }

        groups.set(key, group);
    }

    return [...groups.values()].sort((a, b) => b.total_tokens - a.total_tokens || b.calls - a.calls);
}
