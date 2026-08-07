import { cookie, parseCookies } from "./http.mjs";

const encoder = new TextEncoder();

function base64Url(bytes) {
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary).replaceAll("+", "-").replaceAll("/", "_").replaceAll("=", "");
}

function decodeBase64Url(value) {
  const padded = value.replaceAll("-", "+").replaceAll("_", "/") + "===".slice((value.length + 3) % 4);
  const binary = atob(padded);
  return Uint8Array.from(binary, character => character.charCodeAt(0));
}

async function key(secret) {
  return crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}

async function signature(payload, secret) {
  const result = await crypto.subtle.sign("HMAC", await key(secret), encoder.encode(payload));
  return base64Url(new Uint8Array(result));
}

export async function createSession(user, secret, maxAge = 60 * 60 * 24 * 7) {
  if (!secret) throw new Error("SESSION_SECRET is not configured.");
  const payload = base64Url(encoder.encode(JSON.stringify({
    login: user.login,
    avatarUrl: user.avatar_url,
    issuedAt: Math.floor(Date.now() / 1000),
    expiresAt: Math.floor(Date.now() / 1000) + maxAge
  })));
  return `${payload}.${await signature(payload, secret)}`;
}

export async function readSession(request, secret) {
  if (!secret) return null;
  const token = parseCookies(request).meow_maze_session;
  if (!token) return null;
  const [payload, providedSignature] = token.split(".");
  if (!payload || !providedSignature) return null;
  const valid = await crypto.subtle.verify(
    "HMAC",
    await key(secret),
    decodeBase64Url(providedSignature),
    encoder.encode(payload)
  );
  if (!valid) return null;
  const data = JSON.parse(new TextDecoder().decode(decodeBase64Url(payload)));
  if (!data.expiresAt || data.expiresAt < Math.floor(Date.now() / 1000)) return null;
  return data;
}

export function sessionCookie(token) {
  return cookie("meow_maze_session", token, { maxAge: 60 * 60 * 24 * 7 });
}

export function clearSessionCookie() {
  return cookie("meow_maze_session", "", { maxAge: 0 });
}

export function allowedUsers(env) {
  return String(env.ALLOWED_GITHUB_USERS || "oro1081111")
    .split(",")
    .map(value => value.trim().toLowerCase())
    .filter(Boolean);
}

export async function requireAdmin(context) {
  const user = await readSession(context.request, context.env.SESSION_SECRET);
  if (!user) throw Object.assign(new Error("Authentication required."), { status: 401 });
  if (!allowedUsers(context.env).includes(user.login.toLowerCase())) throw Object.assign(new Error("This GitHub account is not an administrator."), { status: 403 });
  return user;
}
