import { allowedOrigin, cookie, redirect } from "../_lib/http.mjs";

export async function onRequestGet(context) {
  const { request, env } = context;
  if (!env.GITHUB_OAUTH_CLIENT_ID) return new Response("GITHUB_OAUTH_CLIENT_ID is not configured.", { status: 500 });
  const state = crypto.randomUUID();
  const callback = `${allowedOrigin(request)}/api/auth/callback`;
  const target = new URL("https://github.com/login/oauth/authorize");
  target.searchParams.set("client_id", env.GITHUB_OAUTH_CLIENT_ID);
  target.searchParams.set("redirect_uri", callback);
  target.searchParams.set("scope", "read:user");
  target.searchParams.set("state", state);
  return redirect(target.toString(), {
    headers: { "set-cookie": cookie("meow_maze_oauth_state", state, { maxAge: 600 }) }
  });
}
