import { allowedOrigin, redirect } from "../_lib/http.mjs";
import { clearSessionCookie } from "../_lib/session.mjs";

export async function onRequestGet(context) {
  return redirect(`${allowedOrigin(context.request)}/`, {
    headers: { "set-cookie": clearSessionCookie() }
  });
}
