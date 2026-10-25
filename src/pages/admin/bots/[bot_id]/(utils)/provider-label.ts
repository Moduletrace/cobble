import { HarnessProviderKinds } from "@/src/dict/harness-provider-dict";

type Params = {
    name: string | null;
    kind: string | null;
};

/**
 * A provider as a message's details name it: the name it was saved under,
 * with its kind beside it when that says something more ("Work key ·
 * OpenAI").
 */
export default function providerLabel({ name, kind }: Params) {
    const kind_title = kind ? HarnessProviderKinds.find((k) => k.value == kind)?.title : undefined;

    if (!name) return kind_title || "Unknown provider";
    if (!kind_title || kind_title.toLowerCase() == name.toLowerCase()) return name;

    return `${name} · ${kind_title}`;
}
