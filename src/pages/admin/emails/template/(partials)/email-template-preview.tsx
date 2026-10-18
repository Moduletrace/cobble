type Props = {
    srcDoc: string;
};

export default function EmailTemplatePreview({ srcDoc }: Props) {
    return (
        <iframe
            title="Email Template Preview"
            srcDoc={srcDoc}
            sandbox=""
            loading="lazy"
            width="100%"
            height="850"
            style={{
                border: "none",
                background: "#fff",
                borderRadius: "5px",
            }}
        />
    );
}
