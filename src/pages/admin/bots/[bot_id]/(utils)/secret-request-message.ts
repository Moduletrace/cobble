import type { SecretRequestView } from "@/src/types";

type Params = {
    view: SecretRequestView;
};

/**
 * What the chat tells the bot once the user answered its secret request,
 * so it carries on. Only the key: the value never goes into a message.
 */
export default function secretRequestMessage({ view }: Params) {
    if (view.status == "declined") return `I declined to give ${view.key} (secret request #${view.id}).`;

    return `I saved ${view.key} (secret request #${view.id}). It's set as $${view.key} on your computers from your next run.`;
}
