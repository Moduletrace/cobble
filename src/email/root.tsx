import type { PropsWithChildren } from "react";
import { CompanyLetterheadDefaults } from "@/src/dict/company-dict";
import { SiteData } from "@/src/data/site-data";
import { ThemeColors } from "@/src/functions/backend/theme/theme-colors";

type Props = PropsWithChildren & {};

const Brand = {
    ink: ThemeColors.ink,
    muted: ThemeColors.muted,
    page: ThemeColors.page,
    surface: ThemeColors.surface,
    hairline: ThemeColors.hairline,
} as const;

const font_stack =
    "-apple-system, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji'";

type FooterLinkProps = {
    label: string;
};

function FooterLink({ label }: FooterLinkProps) {
    return (
        <span
            style={{
                fontSize: "12px",
                lineHeight: "1.8",
                color: Brand.muted,
            }}
        >
            {label}
        </span>
    );
}

export default function EmailRoot({ children }: Props) {
    const footer_links = [
        CompanyLetterheadDefaults.phone,
        CompanyLetterheadDefaults.email,
        CompanyLetterheadDefaults.website,
    ];

    // Absolute URL - email clients cannot resolve site-relative paths.
    const logo_url = `${SiteData["SiteURL"]}/logos/logo.png`;
    const logo_size = 40;

    return (
        <html lang="en">
            <head>
                <meta charSet="utf-8" />
                <meta
                    name="viewport"
                    content="width=device-width, initial-scale=1"
                />
                <meta name="color-scheme" content="light" />
                <meta name="format-detection" content="telephone=no" />
                <title>{CompanyLetterheadDefaults.name}</title>
            </head>
            <body
                style={{
                    margin: "0",
                    padding: "0",
                    background: Brand.page,
                    fontFamily: font_stack,
                    fontSize: "15px",
                    color: Brand.ink,
                    WebkitTextSizeAdjust: "100%",
                }}
            >
                <table
                    role="presentation"
                    width="100%"
                    cellPadding={0}
                    cellSpacing={0}
                    style={{ background: Brand.page }}
                    bgcolor={Brand.page}
                >
                    <tbody>
                        <tr>
                            <td align="center" style={{ padding: "40px 16px" }}>
                                <table
                                    role="presentation"
                                    width="100%"
                                    cellPadding={0}
                                    cellSpacing={0}
                                    style={{
                                        maxWidth: "600px",
                                        background: Brand.surface,
                                        border: `1px solid ${Brand.hairline}`,
                                        boxShadow:
                                            "0 2px 14px rgba(20, 22, 26, 0.08)",
                                    }}
                                    bgcolor={Brand.surface}
                                >
                                    <tbody>
                                        <tr
                                            aria-hidden
                                            style={{
                                                background: Brand.ink,
                                                height: "6px",
                                                fontSize: "1px",
                                            }}
                                        >
                                            <td>&nbsp;</td>
                                        </tr>
                                        <tr>
                                            <td
                                                style={{
                                                    padding: "26px",
                                                }}
                                            >
                                                <a
                                                    href={
                                                        CompanyLetterheadDefaults.website
                                                    }
                                                    style={{
                                                        textDecoration: "none",
                                                        display: "flex",
                                                        alignItems: "center",
                                                        gap: "10px",
                                                    }}
                                                >
                                                    <img
                                                        src={logo_url}
                                                        alt={
                                                            CompanyLetterheadDefaults.name
                                                        }
                                                        width={logo_size}
                                                        height={logo_size}
                                                        style={{
                                                            width: `${logo_size}px`,
                                                            height: `${logo_size}px`,
                                                            border: "0",
                                                        }}
                                                    />
                                                    <span
                                                        style={{
                                                            fontFamily:
                                                                font_stack,
                                                            fontSize: "18px",
                                                            fontWeight: "800",
                                                            letterSpacing:
                                                                "-0.2px",
                                                            color: Brand.ink,
                                                        }}
                                                    >
                                                        {
                                                            CompanyLetterheadDefaults.name
                                                        }
                                                    </span>
                                                </a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                style={{
                                                    padding: "24px 32px 32px",
                                                }}
                                            >
                                                {children}
                                            </td>
                                        </tr>
                                        <tr>
                                            <td
                                                style={{
                                                    borderTop: `1px solid ${Brand.hairline}`,
                                                    padding: "20px 32px 22px",
                                                }}
                                            >
                                                <span
                                                    style={{
                                                        display: "block",
                                                        fontFamily: font_stack,
                                                        fontSize: "13px",
                                                        fontWeight: "700",
                                                        color: Brand.ink,
                                                    }}
                                                >
                                                    {
                                                        CompanyLetterheadDefaults.name
                                                    }
                                                </span>
                                                <span
                                                    style={{
                                                        display: "block",
                                                        fontSize: "12px",
                                                        lineHeight: "1.7",
                                                        color: Brand.muted,
                                                    }}
                                                >
                                                    {CompanyLetterheadDefaults.address_lines.join(
                                                        " · ",
                                                    )}
                                                </span>
                                                {footer_links.map(
                                                    (label, index) => (
                                                        <FooterLink
                                                            key={index}
                                                            label={
                                                                index === 0
                                                                    ? label
                                                                    : ` · ${label}`
                                                            }
                                                        />
                                                    ),
                                                )}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </td>
                        </tr>
                    </tbody>
                </table>
            </body>
        </html>
    );
}
