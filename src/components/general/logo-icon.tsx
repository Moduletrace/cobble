import type { ComponentProps } from "react";
import { BotHues } from "@/src/dict/bot-dict";
import BotStone from "./bot-stone";

type Props = {
    icon_size?: number;
    img_props?: Pick<ComponentProps<"svg">, "className">;
};

/**
 * The Cobble mark: the ember stone. Source of truth is
 * `public/logos/logo.svg` (copied from `public/brand/icons/ember.svg`).
 */
export default function LogoIcon({ icon_size = 40, img_props }: Props) {
    return (
        <BotStone
            color={BotHues[0].color}
            stone={BotHues[0].value}
            size={icon_size}
            label="Logo Icon"
            className={img_props?.className}
        />
    );
}
