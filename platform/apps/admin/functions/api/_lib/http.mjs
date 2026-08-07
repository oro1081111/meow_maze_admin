export function json(data, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("content-type", "application/json; charset=utf-8");
  headers.set("cache-control", "no-store");
  return new Response(JSON.stringify(data), { ...init, headers });
}

export function redirect(location, init = {}) {
  const headers = new Headers(init.headers || {});
  headers.set("location", location);
  headers.set("cache-control", "no-store");
  return new Response(null, { status: init.status || 302, headers });
}

export function errorResponse(error, status = 500) {
  const message = error instanceof Error ? error.message : String(error);
  return json({ error: message }, { status });
}

export function parseCookies(request) {
  const result = {};
  const raw = request.headers.get("cookie") || "";
  for (const part of raw.split(";")) {
    const index = part.indexOf("=");
    if (index < 0) continue;
    result[part.slice(0, index).trim()] = decodeURIComponent(part.slice(index + 1).trim());
  }
  return result;
}

export function cookie(name, value, options = {}) {
  const parts = [`${name}=${encodeURIComponent(value)}`];
  if (options.maxAge !== undefined) parts.push(`Max-Age=${options.maxAge}`);
  if (options.path !== false) parts.push(`Path=${options.path || "/"}`);
  if (options.httpOnly !== false) parts.push("HttpOnly");
  if (options.secure !== false) parts.push("Secure");
  parts.push(`SameSite=${options.sameSite || "Lax"}`);
  return parts.join("; ");
}

export function allowedOrigin(request) {
  return new URL(request.url).origin;
}
