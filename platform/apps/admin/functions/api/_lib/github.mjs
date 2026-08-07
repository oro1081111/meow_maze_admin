const API_VERSION = "2022-11-28";

function configuration(env) {
  const repository = env.GITHUB_REPOSITORY || "oro1081111/meow-maze-platform";
  const [owner, repo] = repository.split("/");
  if (!owner || !repo) throw new Error("GITHUB_REPOSITORY must use owner/repository format.");
  return {
    owner,
    repo,
    branch: env.GITHUB_BRANCH || "main",
    root: String(env.PLATFORM_ROOT || "").replace(/^\/+|\/+$/g, "")
  };
}

function headers(env) {
  if (!env.GITHUB_TOKEN) throw new Error("GITHUB_TOKEN is not configured.");
  return {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${env.GITHUB_TOKEN}`,
    "x-github-api-version": API_VERSION,
    "user-agent": "meow-maze-admin"
  };
}

function filePath(env, path) {
  const { root } = configuration(env);
  return [root, path].filter(Boolean).join("/");
}

async function request(env, pathname, options = {}) {
  const response = await fetch(`https://api.github.com${pathname}`, {
    ...options,
    headers: { ...headers(env), ...(options.headers || {}) }
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const error = new Error(data.message || `GitHub API request failed: ${response.status}`);
    error.status = response.status;
    throw error;
  }
  return data;
}

function decodeContent(value) {
  const binary = atob(value.replaceAll("\n", ""));
  const bytes = Uint8Array.from(binary, character => character.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeContent(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

export async function readJsonFile(env, relativePath) {
  const { owner, repo, branch } = configuration(env);
  const path = filePath(env, relativePath);
  const data = await request(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}?ref=${encodeURIComponent(branch)}`);
  return { value: JSON.parse(decodeContent(data.content)), sha: data.sha, path };
}

export async function readJsonFileOrNull(env, relativePath) {
  try {
    return await readJsonFile(env, relativePath);
  } catch (error) {
    if (error.status === 404) return null;
    throw error;
  }
}

export async function writeJsonFile(env, relativePath, value, message, existingSha = null) {
  const { owner, repo, branch } = configuration(env);
  const path = filePath(env, relativePath);
  const body = {
    message,
    content: encodeContent(`${JSON.stringify(value, null, 2)}\n`),
    branch
  };
  if (existingSha) body.sha = existingSha;
  const data = await request(env, `/repos/${owner}/${repo}/contents/${encodeURIComponent(path).replaceAll("%2F", "/")}`, {
    method: "PUT",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" }
  });
  return { commit: data.commit?.sha, contentSha: data.content?.sha, path };
}

export async function listPuzzleFiles(env) {
  const { owner, repo, branch, root } = configuration(env);
  const tree = await request(env, `/repos/${owner}/${repo}/git/trees/${encodeURIComponent(branch)}?recursive=1`);
  const prefix = [root, "data/puzzles"].filter(Boolean).join("/") + "/";
  return tree.tree
    .filter(item => item.type === "blob" && item.path.startsWith(prefix) && item.path.endsWith(".json"))
    .map(item => item.path.slice(root ? root.length + 1 : 0));
}

export async function latestWorkflowRuns(env) {
  const { owner, repo, branch } = configuration(env);
  return request(env, `/repos/${owner}/${repo}/actions/runs?branch=${encodeURIComponent(branch)}&per_page=5`);
}
