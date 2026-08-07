import { allowedOrigin, cookie, parseCookies, redirect } from "../_lib/http.mjs";
import { allowedUsers, createSession, sessionCookie } from "../_lib/session.mjs";

export async function onRequestGet(context) {
  const { request, env } = context;
  try {
    if (!env.GITHUB_OAUTH_CLIENT_ID || !env.GITHUB_OAUTH_CLIENT_SECRET) throw new Error("GitHub OAuth is not configured.");
    const url = new URL(request.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const expectedState = parseCookies(request).meow_maze_oauth_state;
    if (!code || !state || !expectedState || state !== expectedState) throw new Error("OAuth state verification failed.");

    const tokenResponse = await fetch("https://github.com/login/oauth/access_token", {
      method: "POST",
      headers: { accept: "application/json", "content-type": "application/json", "user-agent": "meow-maze-admin" },
      body: JSON.stringify({
        client_id: env.GITHUB_OAUTH_CLIENT_ID,
        client_secret: env.GITHUB_OAUTH_CLIENT_SECRET,
        code,
        redirect_uri: `${allowedOrigin(request)}/api/auth/callback`
      })
    });
    const tokenData = await tokenResponse.json();
    if (!tokenResponse.ok || !tokenData.access_token) throw new Error(tokenData.error_description || "Could not obtain GitHub access token.");

    const userResponse = await fetch("https://api.github.com/user", {
      headers: {
        accept: "application/vnd.github+json",
        authorization: `Bearer ${tokenData.access_token}`,
        "x-github-api-version": "2022-11-28",
        "user-agent": "meow-maze-admin"
      }
    });
    const user = await userResponse.json();
    if (!userResponse.ok || !user.login) throw new Error("Could not read the GitHub account.");
    if (!allowedUsers(env).includes(user.login.toLowerCase())) throw Object.assign(new Error("This GitHub account is not an administrator."), { status: 403 });

    const session = await createSession(user, env.SESSION_SECRET);
    return redirect(`${allowedOrigin(request)}/`, {
      headers: {
        "set-cookie": [
          sessionCookie(session),
          cookie("meow_maze_oauth_state", "", { maxAge: 0 })
        ].join(", ")
      }
    });
  } catch (error) {
    return new Response(error.message, { status: error.status || 400 });
  }
}
