import Row from "@moduletrace/twui/layout/Row";
import { ThemePreferences } from "@/src/dict/theme-preferences-dict";
import useThemePreference from "@/src/hooks/use-theme-preference";
import ThemeOption from "./theme-option";

/**
 * Applies on click; there is nothing to save.
 */
export default function ThemePicker() {
    const { preference, setPreference } = useThemePreference();

    return (
        <Row
            role="radiogroup"
            aria-label="Theme"
            className="w-full grid grid-cols-1 sm:grid-cols-3 gap-3!"
        >
            {ThemePreferences.map((option) => (
                <ThemeOption
                    key={option.value}
                    {...option}
                    selected={preference == option.value}
                    onSelect={() => setPreference(option.value)}
                />
            ))}
        </Row>
    );
}
