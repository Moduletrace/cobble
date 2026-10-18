import { AppContext } from "@/src/pages/__root";
import { useContext } from "react";
import Row from "@moduletrace/twui/layout/Row";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import Img from "@moduletrace/twui/layout/Img";
import type { User } from "@/src/types";

export default function AdminAsideUser() {
    const { pageProps } = useContext(AppContext);
    const user = pageProps?.user as User | undefined;

    if (!user?.logged_in_status) {
        return null;
    }

    const full_name = [user.first_name, user.last_name]
        .filter(Boolean)
        .join(" ");

    return (
        <a href="/admin/settings" className="block w-full">
            <Row className="w-full flex-nowrap gap-3! rounded-default px-3 py-2.5 hover:bg-slate-900/5 dark:hover:bg-white/5 transition-colors">
                <Img
                    alt={full_name}
                    src={user.image_thumbnail ?? "/icons/man.png"}
                    size={32}
                    circle
                    className="bg-slate-300 dark:bg-slate-700 shrink-0"
                />
                <Stack className="gap-0! min-w-0">
                    <Span className="text-sm font-medium text-foreground-light dark:text-foreground-dark truncate max-w-[150px]">
                        {full_name}
                    </Span>
                    <Span className="text-xs text-slate-500 dark:text-slate-400 truncate max-w-[150px]">
                        {user.email}
                    </Span>
                </Stack>
            </Row>
        </a>
    );
}
