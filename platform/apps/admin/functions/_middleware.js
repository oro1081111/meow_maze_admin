export async function onRequest(context) {
  const response = await context.next();
  const headers = new Headers(response.headers);
  headers.set("x-content-type-options", "nosniff");
  headers.set("referrer-policy", "no-referrer");

  const combined = headers.get("set-cookie");
  const marker = ", meow_maze_oauth_state=";
  if (combined?.includes(marker)) {
    const [session, stateTail] = combined.split(marker);
    headers.delete("set-cookie");
    headers.append("set-cookie", session);
    headers.append("set-cookie", `meow_maze_oauth_state=${stateTail}`);
  }

  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers
  });
}
