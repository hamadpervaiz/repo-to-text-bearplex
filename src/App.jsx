import { useState, useCallback } from 'react';
import { Github, Zap } from 'lucide-react';
import RepoForm from './components/RepoForm';
import DirectoryTree from './components/DirectoryTree';
import OutputPanel from './components/OutputPanel';
import { parseRepoUrl, fetchDefaultBranch, fetchRepoTree, fetchFilesContent } from './utils/github';
import { buildTree, generateDirectoryString, formatOutput, isBinaryFile } from './utils/formatter';

export default function App() {
  const [tree, setTree] = useState(null);
  const [repoInfo, setRepoInfo] = useState(null);
  const [selected, setSelected] = useState(new Set());
  const [output, setOutput] = useState('');
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [progress, setProgress] = useState(null);
  const [error, setError] = useState('');
  const [token, setToken] = useState('');

  const handleFetch = useCallback(async ({ url, token: tk, ref, path }) => {
    setError('');
    setTree(null);
    setOutput('');
    setSelected(new Set());
    setLoading(true);
    setToken(tk);

    try {
      const parsed = parseRepoUrl(url);
      if (!parsed) throw new Error('Invalid GitHub URL. Use format: https://github.com/owner/repo');

      if (ref) parsed.ref = ref;
      if (path) parsed.path = path;

      if (!parsed.ref) {
        parsed.ref = await fetchDefaultBranch(parsed.owner, parsed.repo, tk);
      }

      const flatTree = await fetchRepoTree(parsed.owner, parsed.repo, parsed.ref, tk);
      const items = flatTree.filter(item => item.type === 'blob' || item.type === 'tree');

      let filteredItems = items;
      if (parsed.path) {
        filteredItems = items.filter(
          item => item.path === parsed.path || item.path.startsWith(parsed.path + '/')
        );
      }

      const builtTree = buildTree(filteredItems, parsed.path);
      setTree(builtTree);
      setRepoInfo(parsed);

      // Auto-select all non-binary blob files
      const allFiles = filteredItems
        .filter(item => item.type === 'blob' && !isBinaryFile(item.path))
        .map(item => item.path);
      setSelected(new Set(allFiles));
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleGenerate = useCallback(async () => {
    if (!repoInfo || selected.size === 0) return;
    setGenerating(true);
    setProgress({ current: 0, total: selected.size });
    setOutput('');

    try {
      const paths = Array.from(selected).sort();
      const nonBinaryPaths = paths.filter(p => !isBinaryFile(p));

      const fileContents = await fetchFilesContent(
        repoInfo.owner, repoInfo.repo, nonBinaryPaths, repoInfo.ref, token,
        (current, total) => setProgress({ current, total })
      );

      // Build directory string from selected files only
      const selectedItems = paths.map(p => ({ path: p, type: 'blob' }));
      const selectedTree = buildTree(selectedItems, repoInfo.path);
      const dirString = generateDirectoryString(selectedTree);

      const result = formatOutput(repoInfo, paths, fileContents, dirString);
      setOutput(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerating(false);
      setProgress(null);
    }
  }, [repoInfo, selected, token]);

  return (
    <div className="min-h-screen bg-[var(--bg-primary)]">
      {/* Header */}
      <header className="border-b border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-[var(--accent)] p-1.5 rounded-lg">
              <Github className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-semibold text-[var(--text-primary)] leading-tight">
                Repo to Text
              </h1>
              <p className="text-xs text-[var(--text-secondary)]">by BearPlex</p>
            </div>
          </div>
          <a
            href="https://bearplex.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            bearplex.com
          </a>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-6">
        {/* Form */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl p-5 mb-6">
          <RepoForm onSubmit={handleFetch} loading={loading} />
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-500/10 border border-[var(--error)] text-[var(--error)] rounded-lg px-4 py-3 mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Tree + Output */}
        {tree && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Directory Tree */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border-color)]">
                <h2 className="text-sm font-medium text-[var(--text-primary)]">
                  Repository Files
                </h2>
                <button
                  onClick={handleGenerate}
                  disabled={generating || selected.size === 0}
                  className="flex items-center gap-1.5 px-4 py-1.5 text-sm font-medium bg-[var(--success)] hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors cursor-pointer border-0"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Generate ({selected.size} files)
                </button>
              </div>
              <DirectoryTree
                tree={tree}
                selected={selected}
                onSelectionChange={setSelected}
              />
            </div>

            {/* Output */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl overflow-hidden">
              <OutputPanel
                output={output}
                loading={generating}
                progress={progress}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
