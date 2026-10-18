import { CompanyLetterheadDefaults } from "@/src/dict/company-dict";
import { SiteData } from "@/src/data/site-data";
import { ThemeColors } from "@/src/functions/backend/theme/theme-colors";
import EmailTemplateDetailRow from "../(partials)/email-template-detail-row";

const dummy_data = {
    recipient_name: "Amara",
    inviter_name: "Daniel Mensah",
    workspace_name: "Northwind Labs",
    role: "Editor",
    plan: "Pro (annual)",
    invite_code: "K7Q-4XM",
    expires_in: "7 days",
} as const;

const detail_rows = [
    { label: "Workspace", value: dummy_data.workspace_name, strong: true },
    { label: "Invited by", value: dummy_data.inviter_name },
    { label: "Your role", value: dummy_data.role },
    { label: "Plan", value: dummy_data.plan },
];

const title_bar = (
    <div
        style={{
            fontSize: "13px",
            fontWeight: "600",
            color: ThemeColors.ink,
        }}
    >
        {SiteData["SiteName"]}
    </div>
);

const divider = (
    <hr
        style={{
            border: "none",
            borderTop: `1px solid ${ThemeColors.hairline}`,
        }}
    />
);

export default function EmailTemplateContent() {
    return (
        <div>
            {title_bar}
            {divider}

            <h1
                style={{
                    fontSize: "18px",
                    margin: "0 0 6px",
                }}
            >
                You've been invited to {dummy_data.workspace_name}
            </h1>

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Hi {dummy_data.recipient_name},
                <br />
                <strong>{dummy_data.inviter_name}</strong> has invited you to
                collaborate in the <strong>{dummy_data.workspace_name}</strong>{" "}
                workspace on {SiteData["SiteName"]}.
            </div>

            {divider}

            <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                style={{ fontSize: "13px", borderCollapse: "collapse" }}
            >
                <tbody>
                    {detail_rows.map((row) => (
                        <EmailTemplateDetailRow key={row.label} {...row} />
                    ))}
                </tbody>
            </table>

            {divider}

            <div
                style={{
                    fontSize: "13px",
                    lineHeight: "1.7",
                    color: ThemeColors.body,
                }}
            >
                Accept the invitation with the button below, or enter this
                invite code after signing in:
            </div>

            <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ margin: "14px 0 18px" }}
            >
                <tbody>
                    <tr>
                        <td align="center">
                            <table
                                role="presentation"
                                cellPadding="0"
                                cellSpacing="0"
                                style={{ background: ThemeColors.subtle }}
                                bgcolor={ThemeColors.subtle}
                            >
                                <tbody>
                                    <tr>
                                        <td
                                            align="center"
                                            style={{
                                                padding: "12px 24px",
                                                fontSize: "20px",
                                                fontWeight: "700",
                                                letterSpacing: "6px",
                                                color: ThemeColors.ink,
                                                borderRadius: "10px",
                                            }}
                                        >
                                            {dummy_data.invite_code}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </td>
                    </tr>
                </tbody>
            </table>

            <table
                width="100%"
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
            >
                <tbody>
                    <tr>
                        <td align="center">
                            <a
                                href={CompanyLetterheadDefaults.website}
                                style={{
                                    background: ThemeColors.ink,
                                    color: ThemeColors.surface,
                                    display: "inline-block",
                                    padding: "11px 26px",
                                    borderRadius: "8px",
                                    fontSize: "13px",
                                    fontWeight: "600",
                                    textDecoration: "none",
                                }}
                            >
                                Accept Invitation
                            </a>
                        </td>
                    </tr>
                </tbody>
            </table>

            {divider}

            <div
                style={{
                    fontSize: "12px",
                    lineHeight: "1.7",
                    color: ThemeColors.muted,
                }}
            >
                This invitation expires in {dummy_data.expires_in}. If you
                weren't expecting it, you can safely ignore this email. Need
                help? Contact us at{" "}
                <strong>{CompanyLetterheadDefaults.email}</strong>.
            </div>
        </div>
    );
}