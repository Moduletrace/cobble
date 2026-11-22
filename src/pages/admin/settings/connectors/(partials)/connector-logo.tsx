import Span from "@moduletrace/twui/layout/Span";
import Img from "@moduletrace/twui/layout/Img";
import { Cable } from "lucide-react";
import IconTile from "@/src/components/general/icon-tile";

type Props = {
    logo: string;
    name: string;
};

/**
 * An app's own logo from its provider, on the same tile the lists use for
 * icons. The tile stays put while the picture loads, and an app whose logo
 * is missing or broken shows the connector icon instead.
 */
export default function ConnectorLogo({ logo, name }: Props) {
    if (!logo) return <IconTile Icon={Cable} />;

    return (
        <Span className="size-8 shrink-0 flex items-center justify-center overflow-hidden rounded-default-sm border border-solid border-hairline bg-paper p-1">
            <Img
                src={logo}
                alt={name}
                className="size-full object-contain"
                imgErrComp={<Cable size={16} aria-hidden />}
            />
        </Span>
    );
}