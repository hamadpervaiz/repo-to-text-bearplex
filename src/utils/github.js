const GITHUB_API = 'https://api.github.com';
const DEFAULT_TOKEN = import.meta.env.VITE_GITHUB_TOKEN || '';

export function getToken(userToken) {
  return userToken || DEFAULT_TOKEN;
}

export function parseRepoUrl(url) {
  url = url.trim().replace(/\/$/, '');
  // Handle various GitHub URL formats
  const patterns = [
    /github\.com\/([^/]+)\/([^/]+?)(?:\.git)?(?:\/tree\/([^/]+)(?:\/(.+))?)?$/,
    /^([^/]+)\/([^/]+)$/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      return {
        owner: match[1],
        repo: match[2],
        ref: match[3] || '',
        path: match[4] || '',
      };
    }
  }
  return null;
}

function headers(token) {
  const h = { Accept: 'application/vnd.github.v3+json' };
  if (token) h.Authorization = `token ${token}`;
  return h;
}

export async function fetchDefaultBranch(owner, repo, token) {
  const tk = getToken(token);
  const res = await fetch(`${GITHUB_API}/repos/${owner}/${repo}`, {
    headers: headers(tk),
  });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Repository not found. Make sure hamad@bearplex.com has access to this repository.');
    if (res.status === 403) throw new Error('API rate limit exceeded. Please try again in a few minutes.');
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  return data.default_branch;
}

export async function fetchRepoTree(owner, repo, ref, token) {
  const tk = getToken(token);
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/git/trees/${ref}?recursive=1`,
    { headers: headers(tk) }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch repo tree: ${res.status} ${res.statusText}`);
  }
  const data = await res.json();
  if (data.truncated) {
    console.warn('Tree was truncated by GitHub API — some files may be missing.');
  }
  return data.tree;
}

export async function fetchFileContent(owner, repo, path, ref, token) {
  const tk = getToken(token);
  const res = await fetch(
    `${GITHUB_API}/repos/${owner}/${repo}/contents/${path}?ref=${ref}`,
    { headers: headers(tk) }
  );
  if (!res.ok) {
    throw new Error(`Failed to fetch ${path}: ${res.status}`);
  }
  const data = await res.json();
  if (data.encoding === 'base64') {
    return atob(data.content);
  }
  return data.content || '';
}

export async function fetchFilesContent(owner, repo, paths, ref, token, onProgress) {
  const results = [];
  const batchSize = 5;

  for (let i = 0; i < paths.length; i += batchSize) {
    const batch = paths.slice(i, i + batchSize);
    const batchResults = await Promise.all(
      batch.map(async (path) => {
        try {
          const content = await fetchFileContent(owner, repo, path, ref, token);
          return { path, content, error: null };
        } catch (err) {
          return { path, content: null, error: err.message };
        }
      })
    );
    results.push(...batchResults);
    if (onProgress) {
      onProgress(Math.min(i + batchSize, paths.length), paths.length);
    }
  }
  return results;
}
