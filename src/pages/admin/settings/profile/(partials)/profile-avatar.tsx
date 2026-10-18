import Img from "@moduletrace/twui/layout/Img";
import Span from "@moduletrace/twui/layout/Span";

type Props = {
    src?: string;
    initials: string;
};

/**
 * 64px round photo, or the initials on sunken paper when there is none.
 * Same treatment as the account row in the rail, just larger.
 */
export default function ProfileAvatar({ src, initials }: Props) {
    if (src) {
        return (
            <Img
                src={src}
                alt="Your photo"
                className="size-16 shrink-0 rounded-full object-cover bg-sunken"
            />
        );
    }

    return (
        <Span
            className="size-16 shrink-0 rounded-full bg-sunken flex items-center justify-center text-lg font-bold leading-none text-ink"
            aria-hidden
        >
            {initials || "?"}
        </Span>
    );
}
