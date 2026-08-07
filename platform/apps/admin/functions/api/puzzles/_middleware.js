import { json } from "./_lib/http.mjs";
import { validatePuzzle } from "../../../../packages/shared/schema.mjs";

export async function onRequest(context) {
  if (context.request.method !== "PUT") return context.next();

  try {
    const input = await context.request.clone().json();
    const result = validatePuzzle(input);
    if (!result.valid) return json({ error: result.errors.join("\n") }, { status: 400 });
    return context.next();
  } catch (error) {
    return json({ error: error.message || "Invalid puzzle request." }, { status: 400 });
  }
}
