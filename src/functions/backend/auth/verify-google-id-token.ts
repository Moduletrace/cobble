import AppError from "@/src/utils/app-error";

type GoogleJWTHeader = {
    alg?: string;
    kid?: string;
    typ?: string;
};

type GoogleJWKS = {
    keys?: GoogleJWK[];
};

type GoogleJWK = JsonWebKey & {
    kid?: string;
};

type GoogleIDTokenPayload = {
    aud?: string | string[];
    email?: string;
    email_verified?: boolean | string;
    exp?: number | string;
    family_name?: string;
    given_name?: string;
    iss?: string;
    name?: string;
    picture?: string;
    sub?: string;
};

type Params = {
    clientId: string;
    idToken: string;
};

type GoogleIDTokenUser = Required<Pick<GoogleIDTokenPayload, "email" | "sub">> &
    Pick<
        GoogleIDTokenPayload,
        "name" | "given_name" | "family_name" | "picture"
    >;

const GoogleJWKSUrl = "https://www.googleapis.com/oauth2/v3/certs";

let cachedGoogleKeys: {
    expiresAt: number;
    keys: GoogleJWK[];
} | null = null;

function decodeBase64Url(value: string) {
    const normalizedValue = value.replace(/-/g, "+").replace(/_/g, "/");
    const padding = normalizedValue.length % 4;
    const paddedValue =
        padding === 0
            ? normalizedValue
            : normalizedValue.padEnd(
                  normalizedValue.length + (4 - padding),
                  "=",
              );

    return Buffer.from(paddedValue, "base64");
}

function parseGoogleTokenPart<T>(value: string): T {
    return JSON.parse(decodeBase64Url(value).toString("utf8")) as T;
}

async function getGoogleSigningKeys() {
    if (cachedGoogleKeys && cachedGoogleKeys.expiresAt > Date.now()) {
        return cachedGoogleKeys.keys;
    }

    const response = await fetch(GoogleJWKSUrl);

    if (!response.ok) {
        throw new Error(`Couldn't fetch Google's signing keys`);
    }

    const data = (await response.json()) as GoogleJWKS;

    if (!data.keys?.length) {
        throw new Error(`Google didn't return any signing keys`);
    }

    const maxAge =
        Number(
            response.headers.get("cache-control")?.match(/max-age=(\d+)/)?.[1],
        ) || 300;

    cachedGoogleKeys = {
        expiresAt: Date.now() + maxAge * 1000,
        keys: data.keys,
    };

    return data.keys;
}

function hasMatchingAudience(
    aud: GoogleIDTokenPayload["aud"],
    clientId: string,
) {
    if (Array.isArray(aud)) {
        return aud.includes(clientId);
    }

    return aud === clientId;
}

export default async function verifyGoogleIdToken({
    clientId,
    idToken,
}: Params): Promise<GoogleIDTokenUser> {
    const tokenParts = idToken.split(".");

    if (tokenParts.length !== 3) {
        throw new AppError(`Invalid Google token`);
    }

    const [encodedHeader, encodedPayload, encodedSignature] = tokenParts;

    if (!encodedHeader) {
        throw new Error(`No encodedHeader`);
    }

    if (!encodedPayload) {
        throw new Error(`No encodedPayload`);
    }

    if (!encodedSignature) {
        throw new Error(`No encodedSignature`);
    }

    const header = parseGoogleTokenPart<GoogleJWTHeader>(encodedHeader);
    const payload = parseGoogleTokenPart<GoogleIDTokenPayload>(encodedPayload);

    if (header.alg !== "RS256" || !header.kid) {
        throw new Error(`Unsupported Google token signature`);
    }

    const signingKeys = await getGoogleSigningKeys();
    const signingKey = signingKeys.find((key) => key.kid === header.kid);

    if (!signingKey) {
        throw new Error(`Unknown Google signing key`);
    }

    const importedKey = await crypto.subtle.importKey(
        "jwk",
        signingKey,
        {
            name: "RSASSA-PKCS1-v1_5",
            hash: "SHA-256",
        },
        false,
        ["verify"],
    );

    const isValidSignature = await crypto.subtle.verify(
        "RSASSA-PKCS1-v1_5",
        importedKey,
        decodeBase64Url(encodedSignature),
        new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
    );

    if (!isValidSignature) {
        throw new Error(`Invalid Google token signature`);
    }

    if (!hasMatchingAudience(payload.aud, clientId)) {
        throw new AppError(`Google token was issued for a different app`);
    }

    if (
        payload.iss !== "https://accounts.google.com" &&
        payload.iss !== "accounts.google.com"
    ) {
        throw new AppError(`Invalid Google token issuer`);
    }

    const expiresAt = Number(payload.exp || 0) * 1000;

    if (!expiresAt || expiresAt <= Date.now()) {
        throw new AppError(`Google token has expired`);
    }

    const emailVerified =
        payload.email_verified === true || payload.email_verified === "true";

    if (!payload.email || !emailVerified || !payload.sub) {
        throw new AppError(`Google account email is not verified`);
    }

    return {
        email: payload.email,
        sub: payload.sub,
        name: payload.name,
        given_name: payload.given_name,
        family_name: payload.family_name,
        picture: payload.picture,
    };
}
