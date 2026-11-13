import { twMerge } from "tailwind-merge";
import { RefreshCw } from "lucide-react";
import Button from "@moduletrace/twui/layout/Button";
import type { PullToRefreshState } from "../(hooks)/use-pull-to-refresh";

type Props = {
    state: PullToRefreshState;
    onReload: () => Promise<void>;
};

/**
 * The phone's pull-to-reload control: a lone icon in the room the pull
 * opens under the newest message, a ghost button so it reads as part of
 * the paper rather than a card over it. It stays dim while the pull is
 * only being made or the room is only being held, and lights up once
 * letting go will reload. While the conversation is read again the button
 * shows its own spinner in the icon's place, and tapping it reloads too,
 * so the gesture isn't the only way. Nothing shows until the thread is
 * pulled.
 */
export default function PullToRefreshIndicator({ state, onReload }: Props) {
    if (state == "idle") return null;

    return (
        <Button
            title="Reload the conversation"
            variant="ghost"
            color="text"
            size="smaller"
            loading={state == "refreshing"}
            loadingIconSize="normal"
            onClick={() => void onReload()}
            className={twMerge(
                "absolute bottom-3 left-1/2 z-20 -translate-x-1/2 text-ink-secondary",
                state == "pulling" && "opacity-40",
                state == "ready" && "text-ink",
            )}
            beforeIcon={<RefreshCw size={16} aria-hidden />}
        />
    );
}
