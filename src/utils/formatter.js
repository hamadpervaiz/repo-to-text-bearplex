const BINARY_EXTENSIONS = new Set([
  'png', 'jpg', 'jpeg', 'gif', 'bmp', 'ico', 'svg', 'webp', 'avif',
  'mp3', 'mp4', 'wav', 'avi', 'mov', 'mkv', 'flac', 'ogg',
  'zip', 'tar', 'gz', 'bz2', 'rar', '7z', 'xz',
  'pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
  'exe', 'dll', 'so', 'dylib', 'bin', 'o', 'a',
  'woff', 'woff2', 'ttf', 'otf', 'eot',
  'pyc', 'pyo', 'class', 'jar',
  'db', 'sqlite', 'sqlite3',
]);

export function isBinaryFile(path) {
  const ext = path.split('.').pop().toLowerCase();
  return BINARY_EXTENSIONS.has(ext);
}

export function buildTree(flatItems, basePath = '') {
  const root = { name: '', path: '', type: 'tree', children: {} };

  for (const item of flatItems) {
    let itemPath = item.path;
    if (basePath && itemPath.startsWith(basePath + '/')) {
      itemPath = itemPath.slice(basePath.length + 1);
    } else if (basePath && !itemPath.startsWith(basePath)) {
      continue;
    }

    const parts = itemPath.split('/');
    let current = root;

    for (let i = 0; i < parts.length; i++) {
      const part = parts[i];
      if (!current.children[part]) {
        const isLast = i === parts.length - 1;
        current.children[part] = {
          name: part,
          path: item.path,
          type: isLast ? item.type : 'tree',
          size: item.size || 0,
          children: {},
        };
      }
      current = current.children[part];
    }
  }

  return root;
}

export function generateDirectoryString(node, prefix = '', isLast = true) {
  let result = '';
  const children = Object.values(node.children).sort((a, b) => {
    if (a.type === 'tree' && b.type !== 'tree') return -1;
    if (a.type !== 'tree' && b.type === 'tree') return 1;
    return a.name.localeCompare(b.name);
  });

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    const isLastChild = i === children.length - 1;
    const connector = isLastChild ? '└── ' : '├── ';
    const extension = isLastChild ? '    ' : '│   ';

    result += prefix + connector + child.name + '\n';

    if (child.type === 'tree') {
      result += generateDirectoryString(child, prefix + extension, isLastChild);
    }
  }
  return result;
}

export function formatOutput(repoInfo, selectedFiles, fileContents, directoryTree) {
  let output = '';
  output += `Repository: ${repoInfo.owner}/${repoInfo.repo}\n`;
  if (repoInfo.ref) output += `Branch/Tag: ${repoInfo.ref}\n`;
  if (repoInfo.path) output += `Path: ${repoInfo.path}\n`;
  output += `\n${'='.repeat(60)}\n`;
  output += `Directory Structure\n`;
  output += `${'='.repeat(60)}\n\n`;
  output += directoryTree;
  output += `\n${'='.repeat(60)}\n`;
  output += `File Contents (${fileContents.length} files)\n`;
  output += `${'='.repeat(60)}\n\n`;

  for (const file of fileContents) {
    output += `${'─'.repeat(60)}\n`;
    output += `File: ${file.path}\n`;
    output += `${'─'.repeat(60)}\n`;
    if (file.error) {
      output += `[Error fetching file: ${file.error}]\n`;
    } else if (isBinaryFile(file.path)) {
      output += `[Binary file — content not shown]\n`;
    } else {
      output += file.content + '\n';
    }
    output += '\n';
  }

  return output;
}

export function estimateTokens(text) {
  // Better heuristic token estimation that accounts for code patterns.
  // Real BPE tokenizers split on whitespace, punctuation, camelCase, etc.
  // Code has many short tokens (brackets, operators, single-char vars).
  let tokens = 0;

  // Split by whitespace first
  const words = text.split(/\s+/).filter(Boolean);

  for (const word of words) {
    if (word.length === 0) continue;
    if (word.length <= 2) {
      // Short tokens: brackets, operators, single chars = 1 token each
      tokens += 1;
    } else if (word.length <= 5) {
      // Short words/keywords: "const", "true", "if" = 1 token
      tokens += 1;
    } else if (/^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(word)) {
      // Identifiers — camelCase/snake_case get split by tokenizers
      // Count subwords: split on case changes and underscores
      const subwords = word.split(/(?=[A-Z])|_/).filter(Boolean);
      tokens += Math.max(1, Math.ceil(subwords.length * 0.8));
    } else if (/[{}[\]().,;:!?@#$%^&*=+\-/<>|~`"'\\]/.test(word)) {
      // Mixed punctuation — each special char tends to be its own token
      const specials = (word.match(/[^a-zA-Z0-9]/g) || []).length;
      const alphaRuns = word.split(/[^a-zA-Z0-9]+/).filter(Boolean);
      tokens += specials;
      for (const run of alphaRuns) {
        tokens += Math.max(1, Math.ceil(run.length / 4));
      }
    } else {
      // Fallback: ~3.3 chars per token (tighter than 4, matches real tokenizers better)
      tokens += Math.max(1, Math.ceil(word.length / 3.3));
    }
  }

  // Whitespace/newlines themselves cost tokens too (~1 per line)
  const newlines = (text.match(/\n/g) || []).length;
  tokens += Math.ceil(newlines * 0.2);

  return tokens;
}

export function formatTokenEstimate(text) {
  const tokens = estimateTokens(text);
  if (tokens < 1000) return `~${tokens} tokens`;
  if (tokens < 1000000) return `~${(tokens / 1000).toFixed(1)}k tokens`;
  return `~${(tokens / 1000000).toFixed(1)}M tokens`;
}
