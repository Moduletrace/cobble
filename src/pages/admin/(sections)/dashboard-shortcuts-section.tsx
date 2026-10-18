import Section from "@moduletrace/twui/layout/Section";
import Stack from "@moduletrace/twui/layout/Stack";
import Span from "@moduletrace/twui/layout/Span";
import { DashboardShortcuts } from "../(data)/dashboard-shortcuts";
import DashboardShortcutCard from "../(partials)/dashboard-shortcut-card";

export default function DashboardShortcutsSection() {
    return (
        <Section>
            <Stack className="w-full items-stretch gap-5!">
                <Span className="htag">Jump back in</Span>
                <div className="grid w-full grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                    {DashboardShortcuts.map((shortcut) => (
                        <DashboardShortcutCard
                            key={shortcut.url}
                            {...shortcut}
                        />
                    ))}
                </div>
            </Stack>
        </Section>
    );
}
