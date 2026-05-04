// worker/src/routes/line-oauth.ts
import { Hono } from "hono";

type Bindings = {
  LINE_CHANNEL_ID?: string;
  LINE_CHANNEL_SECRET?: string;
  LINE_REDIRECT_URI?: string;
  FRONTEND_BASE_URL?: string;
};

type LineIdTokenPayload = {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  name?: string;
  picture?: string;
};

type LineProfileResponse = {
  userId?: string;
  displayName?: string;
  pictureUrl?: string;
  statusMessage?: string;
};

export const lineOAuthRoutes = new Hono<{ Bindings: Bindings }>();

const LINE_AUTHORIZE_URL = "https://access.line.me/oauth2/v2.1/authorize";
const LINE_TOKEN_URL = "https://api.line.me/oauth2/v2.1/token";
const LINE_VERIFY_URL = "https://api.line.me/oauth2/v2.1/verify";
const STATE_COOKIE_NAME = "line_oauth_state";
const NONCE_COOKIE_NAME = "line_oauth_nonce";

type LineVerifyResponse = {
  iss?: string;
  sub?: string;
  aud?: string;
  exp?: number;
  iat?: number;
  nonce?: string;
  name?: string;
  picture?: string;
  email?: string;
};

async function verifyLineIdToken(
  idToken: string,
  channelId: string,
): Promise<LineVerifyResponse> {
  const res = await fetch(LINE_VERIFY_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      id_token: idToken,
      client_id: channelId,
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("LINE verify id_token error:", detail);
    throw new Error(`Failed to verify LINE ID token: HTTP ${res.status}`);
  }

  return (await res.json()) as LineVerifyResponse;
}

function getRequiredEnv(value: string | undefined, name: string): string {
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function randomBase64Url(byteLength = 32): string {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return base64UrlEncode(bytes);
}

function base64UrlEncode(input: ArrayBuffer | Uint8Array): string {
  const bytes = input instanceof Uint8Array ? input : new Uint8Array(input);

  let binary = "";
  for (const byte of bytes) {
    binary += String.fromCharCode(byte);
  }

  return btoa(binary)
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function base64UrlDecodeToString(input: string): string {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return new TextDecoder().decode(bytes);
}

function base64UrlDecodeToBytes(input: string): Uint8Array {
  const normalized = input.replaceAll("-", "+").replaceAll("_", "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }

  return bytes;
}

function getCookie(request: Request, name: string): string | null {
  const cookieHeader = request.headers.get("Cookie");
  if (!cookieHeader) {
    return null;
  }

  const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());

  for (const cookie of cookies) {
    const [cookieName, ...valueParts] = cookie.split("=");
    if (cookieName === name) {
      return decodeURIComponent(valueParts.join("="));
    }
  }

  return null;
}

function createCookie(name: string, value: string, maxAgeSeconds: number): string {
  return [
    `${name}=${encodeURIComponent(value)}`,
    "Path=/",
    `Max-Age=${maxAgeSeconds}`,
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

function deleteCookie(name: string): string {
  return [
    `${name}=`,
    "Path=/",
    "Max-Age=0",
    "HttpOnly",
    "Secure",
    "SameSite=Lax",
  ].join("; ");
}

async function fetchLineProfile(
  accessToken: string,
): Promise<LineProfileResponse> {
  const res = await fetch("https://api.line.me/v2/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const detail = await res.text();
    console.error("LINE profile error:", detail);
    throw new Error(`Failed to fetch LINE profile: HTTP ${res.status}`);
  }

  return (await res.json()) as LineProfileResponse;
}

async function verifyHs256Jwt(
  jwt: string,
  secret: string,
): Promise<LineIdTokenPayload> {
  const parts = jwt.split(".");
  if (parts.length !== 3) {
    throw new Error("Invalid ID token format");
  }

  const [encodedHeader, encodedPayload, encodedSignature] = parts;

  const header = JSON.parse(base64UrlDecodeToString(encodedHeader)) as {
    alg?: string;
    typ?: string;
  };

  if (header.alg !== "HS256") {
    throw new Error(`Unsupported ID token alg: ${header.alg ?? "unknown"}`);
  }

  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["verify"],
  );

  const isValidSignature = await crypto.subtle.verify(
    "HMAC",
    key,
    base64UrlDecodeToBytes(encodedSignature),
    new TextEncoder().encode(`${encodedHeader}.${encodedPayload}`),
  );

  if (!isValidSignature) {
    throw new Error("Invalid ID token signature");
  }

  return JSON.parse(base64UrlDecodeToString(encodedPayload)) as LineIdTokenPayload;
}

function buildFrontendRedirectUrl(
  frontendBaseUrl: string,
  payload: {
    userId: string;
    userName: string;
    userPicture: string;
  },
): string {
  const url = new URL("/1_TopLogin", frontendBaseUrl);

  url.searchParams.set("authProvider", "line");
  url.searchParams.set("userId", payload.userId);
  url.searchParams.set("userName", payload.userName);
  url.searchParams.set("userPicture", payload.userPicture);

  return url.toString();
}

function buildFrontendLoginErrorUrl(
  frontendBaseUrl: string,
  message: string,
): string {
  const url = new URL("/3_Login", frontendBaseUrl);
  url.searchParams.set("lineLoginError", message);
  return url.toString();
}

lineOAuthRoutes.get("/", (c) => {
  try {
    const channelId = getRequiredEnv(c.env.LINE_CHANNEL_ID, "LINE_CHANNEL_ID");
    const redirectUri = getRequiredEnv(
      c.env.LINE_REDIRECT_URI,
      "LINE_REDIRECT_URI",
    );

    const state = randomBase64Url(32);
    const nonce = randomBase64Url(32);

    const authorizeUrl = new URL(LINE_AUTHORIZE_URL);
    authorizeUrl.searchParams.set("response_type", "code");
    authorizeUrl.searchParams.set("client_id", channelId);
    authorizeUrl.searchParams.set("redirect_uri", redirectUri);
    authorizeUrl.searchParams.set("state", state);
    authorizeUrl.searchParams.set("scope", "profile openid");
    authorizeUrl.searchParams.set("nonce", nonce);

    const response = c.redirect(authorizeUrl.toString(), 302);
    response.headers.append(
      "Set-Cookie",
      createCookie(STATE_COOKIE_NAME, state, 600),
    );
    response.headers.append(
      "Set-Cookie",
      createCookie(NONCE_COOKIE_NAME, nonce, 600),
    );

    return response;
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error";
    return c.json({ ok: false, error: message }, 500);
  }
});

lineOAuthRoutes.get("/callback", async (c) => {
  const frontendBaseUrl =
    c.env.FRONTEND_BASE_URL || "https://citrus-app-frontend.pages.dev";

  try {
    const channelId = getRequiredEnv(c.env.LINE_CHANNEL_ID, "LINE_CHANNEL_ID");
    const channelSecret = getRequiredEnv(
      c.env.LINE_CHANNEL_SECRET,
      "LINE_CHANNEL_SECRET",
    );
    const redirectUri = getRequiredEnv(
      c.env.LINE_REDIRECT_URI,
      "LINE_REDIRECT_URI",
    );

    const error = c.req.query("error");
    const errorDescription = c.req.query("error_description");

    if (error) {
      return c.redirect(
        buildFrontendLoginErrorUrl(
          frontendBaseUrl,
          errorDescription || error || "LINEログインに失敗しました。",
        ),
        302,
      );
    }

    const code = c.req.query("code");
    const state = c.req.query("state");

    if (!code || !state) {
      return c.redirect(
        buildFrontendLoginErrorUrl(
          frontendBaseUrl,
          "LINEから認証コードまたはstateが返ってきませんでした。",
        ),
        302,
      );
    }

    const expectedState = getCookie(c.req.raw, STATE_COOKIE_NAME);
    const expectedNonce = getCookie(c.req.raw, NONCE_COOKIE_NAME);

    if (!expectedState || state !== expectedState) {
      return c.redirect(
        buildFrontendLoginErrorUrl(
          frontendBaseUrl,
          "LINEログインのstate検証に失敗しました。",
        ),
        302,
      );
    }

    const tokenResponse = await fetch(LINE_TOKEN_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        client_id: channelId,
        client_secret: channelSecret,
      }),
    });

    if (!tokenResponse.ok) {
      const detail = await tokenResponse.text();
      console.error("LINE token error:", detail);

      return c.redirect(
        buildFrontendLoginErrorUrl(
          frontendBaseUrl,
          `LINEトークン取得に失敗しました。HTTP ${tokenResponse.status}`,
        ),
        302,
      );
    }

    const tokenJson = (await tokenResponse.json()) as {
      access_token?: string;
      id_token?: string;
    };

    if (!tokenJson.id_token) {
      return c.redirect(
        buildFrontendLoginErrorUrl(
          frontendBaseUrl,
          "LINEからIDトークンを取得できませんでした。",
        ),
        302,
      );
    }

    // Use LINE's official ID token verification API to validate the ID token.
    const payload = await verifyLineIdToken(tokenJson.id_token, channelId);

    // Fetch LINE profile with access_token to reliably get displayName and pictureUrl.
    const profile = tokenJson.access_token
      ? await fetchLineProfile(tokenJson.access_token)
      : null;

    console.log("LINE profile fields", {
      hasPayloadSub: Boolean(payload.sub),
      hasPayloadName: Boolean(payload.name),
      hasPayloadPicture: Boolean(payload.picture),
      hasAccessToken: Boolean(tokenJson.access_token),
      hasProfileUserId: Boolean(profile?.userId),
      hasProfileDisplayName: Boolean(profile?.displayName),
      hasProfilePictureUrl: Boolean(profile?.pictureUrl),
    });

    // Validate the verified payload
    if (payload.iss !== "https://access.line.me") {
      throw new Error("Invalid ID token issuer");
    }

    if (payload.aud !== channelId) {
      throw new Error("Invalid ID token audience");
    }

    const now = Math.floor(Date.now() / 1000);
    if (payload.exp && payload.exp < now) {
      throw new Error("ID token has expired");
    }

    if (expectedNonce && payload.nonce !== expectedNonce) {
      throw new Error("Invalid ID token nonce");
    }

    if (!payload.sub) {
      throw new Error("ID token does not include sub");
    }

    const lineUserId = profile?.userId || payload.sub;
    const lineUserName = profile?.displayName || payload.name || "LINEユーザー";
    const lineUserPicture = profile?.pictureUrl || payload.picture || "";

    if (!lineUserId) {
      throw new Error("LINE user ID was not found");
    }

    const response = c.redirect(
      buildFrontendRedirectUrl(frontendBaseUrl, {
        userId: lineUserId,
        userName: lineUserName,
        userPicture: lineUserPicture,
      }),
      302,
    );

    response.headers.append("Set-Cookie", deleteCookie(STATE_COOKIE_NAME));
    response.headers.append("Set-Cookie", deleteCookie(NONCE_COOKIE_NAME));

    return response;
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "LINEログイン処理に失敗しました。";

    console.error("LINE OAuth callback error:", message);

    const response = c.redirect(
      buildFrontendLoginErrorUrl(frontendBaseUrl, message),
      302,
    );

    response.headers.append("Set-Cookie", deleteCookie(STATE_COOKIE_NAME));
    response.headers.append("Set-Cookie", deleteCookie(NONCE_COOKIE_NAME));

    return response;
  }
});

export default lineOAuthRoutes;

// Backward-compatible export for worker/src/index.ts
export const lineOAuthRoute = lineOAuthRoutes;
