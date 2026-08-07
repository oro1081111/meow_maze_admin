import { errorResponse, json } from "../_lib/http.mjs";
import { latestWorkflowRuns } from "../_lib/github.mjs";
import { requireAdmin } from "../_lib/session.mjs";

export async function onRequestGet(context) {
  try {
    await requireAdmin(context);
    const data = await latestWorkflowRuns(context.env);
    const runs = (data.workflow_runs || []).map(run => ({
      id: run.id,
      name: run.name,
      status: run.status,
      conclusion: run.conclusion,
      commit: run.head_sha,
      createdAt: run.created_at,
      updatedAt: run.updated_at,
      url: run.html_url
    }));
    return json({ runs });
  } catch (error) {
    return errorResponse(error, error.status || 500);
  }
}
