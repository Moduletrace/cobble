import Span from "@moduletrace/twui/layout/Span";
import type { PublicHarnessProvider } from "@/src/types";
import relativeTime from "@/src/utils/relative-time";

type Props = {
    provider: PublicHarnessProvider;
};

/**
 * Where the provider's key comes from and how its last model sync went.
 */
export default function ProviderStatus({ provider }: Props) {
    const key = provider.has_key
        ? "Key saved"
        : provider.has_env_key
          ? `Key from ${provider.key_env}`
          : provider.needs_key
            ? "Needs a key"
            : "No key needed";

    const sync = !provider.enabled
        ? "Turned off"
        : provider.sync_error
          ? `Last sync failed: ${provider.sync_error}`
          : provider.last_synced_at
            ? `Models synced ${relativeTime({ at: provider.last_synced_at }) == "now" ? "just now" : `${relativeTime({ at: provider.last_synced_at })} ago`}`
            : "Models not synced yet";

    return (
        <Span className="text-[13px] leading-[18px] text-ink-secondary break-words">
            {key} · {sync}
        </Span>
    );
}
