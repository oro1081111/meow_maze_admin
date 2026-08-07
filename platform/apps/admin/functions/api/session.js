import { json } from "./_lib/http.mjs";
import { allowedUsers, readSession } from "./_lib/session.mjs";

export async function onRequestGet(context) {
  const user = await readSession(context.request, context.env.SESSION_SECRET);
  if (!user || !allowedUsers(context.env).includes(user.login.toLowerCase())) return json({ authenticated: false });
  return json({
    authenticated: true,
    user: { login: user.login, avatarUrl: user.avatarUrl }
  });
}
