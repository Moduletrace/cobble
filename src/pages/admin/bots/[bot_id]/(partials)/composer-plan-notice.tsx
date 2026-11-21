import P from "@moduletrace/twui/layout/P";

/**
 * Above the composer's input while Plan mode is on: what the next message
 * does, and how to turn it off, since the mode changes what the bot may
 * touch and must never be a hidden state.
 */
export default function ComposerPlanNotice() {
    return (
        <P className="w-full max-w-container mx-auto px-3 md:px-6 pt-3 text-xs text-ink-secondary">
            Plan mode is on: the bot plans and reads, and changes nothing. Tab turns it off.
        </P>
    );
}