import { ThemeColors } from "@/src/functions/backend/theme/theme-colors";

type Props = {
    label: string;
    value: string;
    strong?: boolean;
};

export default function EmailTemplateDetailRow({ label, value, strong }: Props) {
    return (
        <tr>
            <td style={{ padding: "4px 0", color: ThemeColors.muted }}>
                {label}
            </td>
            <td style={{ padding: "4px 0" }} align="right">
                {strong ? <strong>{value}</strong> : value}
            </td>
        </tr>
    );
}
